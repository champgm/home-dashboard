import { ApplicationService } from "./ApplicationService";
import { HueProvisioningService } from "./HueProvisioningService";
import { HueReauthorizationService } from "./HueReauthorizationService";
import { AppConfig, CommandResult, HueBinding, HueBindingLoadResult } from "./types";
import { HueV1Adapter } from "../protocol/hue/HueV1Adapter";
import { TpLinkLegacyAdapter } from "../protocol/tplink/TpLinkLegacyAdapter";
import { ConfigStore } from "../storage/ConfigStore";
import { CredentialStore } from "../storage/CredentialStore";
import { errorCategory } from "./diagnostics";
import { emitDevelopmentEvent } from "./developmentLogger";

export type Readiness =
  | "Ready"
  | "HueUnconfigured"
  | "HueBindingAbsent"
  | "HueBindingError"
  | "ConfigError"
  | "StorageError";

export interface ApplicationRuntime {
  readonly service: ApplicationService;
  readonly configStore: ConfigStore;
  readonly credentialStore: CredentialStore;
  readonly config?: AppConfig;
  readonly binding?: HueBinding;
  readonly bindingResult: HueBindingLoadResult;
  readonly readiness: Readiness;
  resetLocalConfiguration(): Promise<boolean>;
  saveConfig(mutator: (config: AppConfig) => AppConfig): Promise<boolean>;
  provisionHue(bridgeIpv4: string): Promise<CommandResult<HueBinding>>;
  reauthorizeHue(): Promise<CommandResult<HueBinding>>;
}

export async function bootstrapApplication(): Promise<ApplicationRuntime> {
  emitDevelopmentEvent("info", "bootstrap.started");
  try {
    const configStore = new ConfigStore();
    const credentialStore = new CredentialStore();
    const configResult = await configStore.load();
    const bindingResult = await credentialStore.getBinding();
    const config = "config" in configResult ? configResult.config : undefined;
    const binding = bindingResult.status === "present" ? bindingResult.binding : undefined;
    const hue = config?.bridge.ipv4 && bindingResult.status === "present"
      ? new HueV1Adapter({
        bridgeIpv4: config.bridge.ipv4,
        credential: bindingResult.binding.credential,
        expectedBridgeId: bindingResult.binding.bridgeId,
      })
      : undefined;
    const service = new ApplicationService({ configStore, credentialStore, hue, plugs: new TpLinkLegacyAdapter() });
    const readiness: Readiness = configResult.status === "corrupt"
      ? "ConfigError"
      : configResult.status === "ioError"
        ? "StorageError"
        : bindingResult.status === "ioError"
          ? "HueBindingError"
          : bindingResult.status === "absent"
            ? "HueBindingAbsent"
            : config?.bridge.ipv4
              ? "Ready"
              : "HueUnconfigured";
    let activeBinding = binding;
    let activeBindingResult = bindingResult;
    let activeReadiness = readiness;

    const provisioning = new HueProvisioningService(
      configStore,
      credentialStore,
      (ipv4, credential) => new HueV1Adapter({ bridgeIpv4: ipv4, credential }),
    );
    const reauthorization = new HueReauthorizationService(
      configStore,
      credentialStore,
      (ipv4, credential) => new HueV1Adapter({ bridgeIpv4: ipv4, credential }),
    );

    emitDevelopmentEvent("info", "bootstrap.completed", {
      readiness,
      configStatus: configResult.status,
      bindingStatus: bindingResult.status,
      hasBridgeAddress: Boolean(config?.bridge.ipv4),
      plugCount: config?.plugs.length || 0,
      favoriteCount: config?.favorites.length || 0,
    });

    return {
      service,
      configStore,
      credentialStore,
      config,
      get binding() { return activeBinding; },
      get bindingResult() { return activeBindingResult; },
      get readiness() { return activeReadiness; },
      async resetLocalConfiguration() {
        const result = await configStore.reset();
        if (result.status === "success" && activeBindingResult.status === "present") {
          const next = configStore.getCommitted();
          if (next?.bridge.ipv4) {
            service.setHueClient(new HueV1Adapter({
              bridgeIpv4: next.bridge.ipv4,
              credential: activeBindingResult.binding.credential,
              expectedBridgeId: activeBindingResult.binding.bridgeId,
            }));
            activeReadiness = "Ready";
          } else {
            service.setHueClient(undefined);
            activeReadiness = "HueUnconfigured";
          }
        }
        return result.status === "success";
      },
      async saveConfig(mutator) {
        const current = configStore.getCommitted() || config;
        if (!current) return false;
        const result = await configStore.mutate(mutator);
        if (result.status === "success" && activeBindingResult.status === "present") {
          const next = configStore.getCommitted();
          if (next?.bridge.ipv4) {
            service.setHueClient(new HueV1Adapter({
              bridgeIpv4: next.bridge.ipv4,
              credential: activeBindingResult.binding.credential,
              expectedBridgeId: activeBindingResult.binding.bridgeId,
            }));
          } else service.setHueClient(undefined);
        }
        return result.status === "success";
      },
      async provisionHue(bridgeIpv4) {
        const started = Date.now();
        try {
          const result = await provisioning.provision(bridgeIpv4);
          emitDevelopmentEvent("info", "provisioning.completed", commandEventContext(
            "Hue link-button provisioning",
            result,
            Date.now() - started,
          ));
          if (result.kind === "success" && result.value) {
            service.clearDiagnostic("hue:provisioning");
            activeBinding = result.value;
            activeBindingResult = { status: "present", binding: result.value };
            activeReadiness = "Ready";
            service.setHueClient(new HueV1Adapter({
              bridgeIpv4,
              credential: result.value.credential,
              expectedBridgeId: result.value.bridgeId,
            }));
          } else if (result.diagnostic) {
            service.setDiagnostic("hue:provisioning", result.diagnostic);
          }
          return result;
        } catch (error) {
          emitDevelopmentEvent("error", "provisioning.completed", thrownCommandEventContext(
            "Hue link-button provisioning",
            error,
            Date.now() - started,
          ));
          throw error;
        }
      },
      async reauthorizeHue() {
        const started = Date.now();
        try {
          const result = await reauthorization.reauthorize();
          emitDevelopmentEvent("info", "reauthorization.completed", commandEventContext(
            "Hue same-bridge reauthorization",
            result,
            Date.now() - started,
          ));
          if (result.kind === "success" && result.value) {
            activeBinding = result.value;
            activeBindingResult = { status: "present", binding: result.value };
            activeReadiness = "Ready";
            const configuredIpv4 = configStore.getCommitted()?.bridge.ipv4;
            if (configuredIpv4) {
              service.setHueClient(new HueV1Adapter({
                bridgeIpv4: configuredIpv4,
                credential: result.value.credential,
                expectedBridgeId: result.value.bridgeId,
              }));
            }
          }
          return result;
        } catch (error) {
          emitDevelopmentEvent("error", "reauthorization.completed", thrownCommandEventContext(
            "Hue same-bridge reauthorization",
            error,
            Date.now() - started,
          ));
          throw error;
        }
      }
    };
  } catch (error) {
    emitDevelopmentEvent("error", "bootstrap.failed", {
      category: errorCategory(error),
      cause: error,
    });
    throw error;
  }
}

function commandEventContext(
  operation: string,
  result: CommandResult,
  elapsedMs: number,
): Record<string, unknown> {
  const value = result.diagnostic;
  return {
    operation,
    resultKind: result.kind,
    elapsedMs: Math.max(0, elapsedMs),
    ...(value ? {
      category: value.category,
      ...(value.resource ? { resource: value.resource } : {}),
      ...(value.statusCode !== undefined ? { statusCode: value.statusCode } : {}),
      ...(value.protocolCode !== undefined ? { protocolCode: value.protocolCode } : {}),
      ...(value.detail || value.message ? { cause: value.detail || value.message } : {}),
    } : {}),
  };
}

function thrownCommandEventContext(
  operation: string,
  error: unknown,
  elapsedMs: number,
): Record<string, unknown> {
  return {
    operation,
    resultKind: "thrown",
    elapsedMs: Math.max(0, elapsedMs),
    category: errorCategory(error),
    cause: error,
  };
}
