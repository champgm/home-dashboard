import { ConfigStore } from "../storage/ConfigStore";
import { CredentialStore } from "../storage/CredentialStore";
import { HueV1Adapter } from "../protocol/hue/HueV1Adapter";
import { CommandResult, HueBinding } from "./types";
import { diagnostic } from "./diagnostics";
import { definiteFailure, success } from "./commandResults";

export class HueReauthorizationService {
  private readonly configStore: ConfigStore;
  private readonly credentialStore: CredentialStore;
  private readonly adapterFactory: (ipv4: string, credential?: string) => HueV1Adapter;

  constructor(configStore: ConfigStore, credentialStore: CredentialStore, adapterFactory: (ipv4: string, credential?: string) => HueV1Adapter) {
    this.configStore = configStore;
    this.credentialStore = credentialStore;
    this.adapterFactory = adapterFactory;
  }

  async reauthorize(): Promise<CommandResult<HueBinding>> {
    const stored = await this.credentialStore.getBinding();
    if (stored.status !== "present") {
      return definiteFailure(diagnostic("StorageError", "The permanent Hue binding is unavailable."));
    }
    const ipv4 = this.configStore.getCommitted()?.bridge.ipv4;
    if (!ipv4) return definiteFailure(diagnostic("ConfigCorrupt", "Configure the bound bridge address first."));
    let candidateAdapter: HueV1Adapter;
    try {
      candidateAdapter = this.adapterFactory(ipv4);
    } catch (_error) {
      return definiteFailure(diagnostic("ProtocolRejected", "The configured bridge address is invalid."));
    }
    let credential: string;
    try {
      credential = await candidateAdapter.provision();
      const config = await candidateAdapter.getConfigWithCredential(credential);
      if (config.bridgeid !== stored.binding.bridgeId) {
        return definiteFailure(diagnostic("BridgeIdentityMismatch", "The authorized bridge does not match this app installation."));
      }
    } catch (_error) {
      return definiteFailure(diagnostic("AuthenticationRejected", "Same-bridge reauthorization was not completed."));
    }
    const binding: HueBinding = { bridgeId: stored.binding.bridgeId, credential };
    const saved = await this.credentialStore.setBinding(binding);
    return saved.status === "success"
      ? success(binding)
      : definiteFailure(diagnostic("StorageError", "The replacement Hue authorization was not stored."));
  }
}
