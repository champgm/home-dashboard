import { ConfigStore } from "../storage/ConfigStore";
import { CredentialStore } from "../storage/CredentialStore";
import { HueV1Adapter } from "../protocol/hue/HueV1Adapter";
import { AppConfig, CommandResult, HueBinding } from "./types";
import { diagnostic } from "./diagnostics";
import { definiteFailure, success } from "./commandResults";
import { validatePrivateIpv4 } from "../config/endpointValidation";

export class HueProvisioningService {
  private readonly configStore: ConfigStore;
  private readonly credentialStore: CredentialStore;
  private readonly adapterFactory: (ipv4: string, credential?: string) => HueV1Adapter;

  constructor(
    configStore: ConfigStore,
    credentialStore: CredentialStore,
    adapterFactory: (ipv4: string, credential?: string) => HueV1Adapter,
  ) {
    this.configStore = configStore;
    this.credentialStore = credentialStore;
    this.adapterFactory = adapterFactory;
  }

  async provision(bridgeIpv4: string): Promise<CommandResult<HueBinding>> {
    const address = validatePrivateIpv4(bridgeIpv4);
    if (!address.valid) return definiteFailure(diagnostic("ProtocolRejected", address.error?.message || "Invalid bridge address."));
    const existing = await this.credentialStore.getBinding();
    if (existing.status === "ioError") return definiteFailure(diagnostic("StorageError", "Protected Hue storage is unavailable."));
    if (existing.status === "present") return definiteFailure(diagnostic("BridgeIdentityMismatch", "This app installation is already bound to a Hue bridge."));
    const savedEndpoint = await this.configStore.mutate((current) => ({ ...current, bridge: { ipv4: address.value } }));
    if (savedEndpoint.status !== "success") return definiteFailure(diagnostic("StorageError", "Bridge address could not be saved."));
    let adapter: HueV1Adapter;
    try {
      adapter = this.adapterFactory(address.value!);
    } catch (_error) {
      return definiteFailure(diagnostic("ProtocolRejected", "The bridge address could not be configured."));
    }
    let credential: string;
    try {
      credential = await adapter.provision();
    } catch (_error) {
      return definiteFailure(diagnostic("ProtocolRejected", "Hue did not authorize this application."));
    }
    let config: Record<string, unknown>;
    try {
      config = await adapter.getConfigWithCredential(credential);
    } catch (_error) {
      return definiteFailure(diagnostic("AuthenticationRejected", "The new Hue authorization could not be verified."));
    }
    if (typeof config.bridgeid !== "string" || config.bridgeid.length === 0) {
      return definiteFailure(diagnostic("ProtocolMalformed", "Hue configuration did not identify the bridge."));
    }
    const binding: HueBinding = { bridgeId: config.bridgeid, credential };
    const stored = await this.credentialStore.setBinding(binding);
    if (stored.status !== "success") {
      return definiteFailure(diagnostic("StorageError", "Hue authorization was not stored; setup is incomplete."));
    }
    return success(binding);
  }
}
