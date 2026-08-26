export type HueSearchKind = "lights" | "sensors";

export interface HueSearchStatus {
  readonly kind: HueSearchKind;
  readonly active: boolean;
  readonly recent: boolean;
  readonly raw: unknown;
}

export function parseSearchStatus(kind: HueSearchKind, raw: unknown): HueSearchStatus {
  const record = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const active = record.active === true
    || isActiveMarker(record.status)
    || isActiveMarker(record.lastscan)
    || isActiveMarker(record.lastsearched);
  const recent = active || record.lastscan !== undefined || record.lastsearched !== undefined;
  return { kind, active, recent, raw };
}

export function canStartSearch(status: HueSearchStatus): boolean {
  return !status.active && !status.recent;
}

function isActiveMarker(value: unknown): boolean {
  return typeof value === "string" && ["active", "searching", "in_progress", "in-progress"].includes(value.trim().toLowerCase());
}
