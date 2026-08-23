import { ConfigStore } from "../storage/ConfigStore";
import { ApplicationService } from "./ApplicationService";
import { CommandResult, Diagnostic, ResourceKind, ResourceRef } from "./types";
import { diagnostic } from "./diagnostics";
import { definiteFailure, success } from "./commandResults";

export interface DestructiveActionSpec {
  readonly objectName: string;
  readonly objectType: string;
  readonly consequence: string;
  readonly action: () => Promise<CommandResult>;
}

export function destructiveActionSpec(
  objectName: string,
  objectType: string,
  consequence: string,
  action: () => Promise<CommandResult>,
): DestructiveActionSpec {
  return { objectName, objectType, consequence, action };
}

export async function deleteHueResourceOnce(
  service: ApplicationService,
  kind: Exclude<ResourceKind, "plug">,
  id: string,
): Promise<CommandResult> {
  return service.deleteHue(kind, id);
}

/**
 * The actual remote DELETE is deliberately supplied by the service boundary;
 * this helper only performs one attempt and then one best-effort local cleanup.
 */
export async function performConfirmedHueDelete(
  service: ApplicationService,
  configStore: ConfigStore,
  kind: Exclude<ResourceKind, "plug">,
  id: string,
  deleteRemote: () => Promise<CommandResult>,
): Promise<CommandResult> {
  const result = await deleteRemote();
  if (result.kind !== "success") return result;
  const cleanup = await configStore.mutate((current) => ({
    ...current,
    favorites: current.favorites.filter((favorite) => !(favorite.kind === kind && favorite.id === id)),
  }));
  if (cleanup.status !== "success") {
    // The remote delete remains complete; never repeat it because cleanup did
    // not persist. The stale Favorite is intentionally recoverable by UI.
    return { ...result, diagnostic: diagnostic("StorageError", "The resource was deleted, but its Favorite cleanup was not saved.") };
  }
  return result;
}

export async function removePlugEndpointOnce(service: ApplicationService, endpointId: string): Promise<CommandResult> {
  return service.removePlugEndpoint(endpointId);
}

export function missingFavoriteDiagnostic(ref: ResourceRef): Diagnostic {
  return diagnostic("Unknown", "Favorite target is missing or unreachable.", { resource: `${ref.kind}:${ref.id || ref.plugEndpointId || ""}` });
}
