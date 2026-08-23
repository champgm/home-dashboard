export type HueSearchKind = "lights" | "sensors";

export interface HueSearchStatus {
  readonly kind: HueSearchKind;
  readonly active: boolean;
  readonly recent: boolean;
  readonly raw: unknown;
}

export function parseSearchStatus(kind: HueSearchKind, raw: unknown): HueSearchStatus {
  const record = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const active = record.active === true || record.status === "active" || record.status === "searching";
  const recent = active || record.lastscan !== undefined || record.lastsearched !== undefined;
  return { kind, active, recent, raw };
}

export function canStartSearch(status: HueSearchStatus): boolean {
  return !status.active && !status.recent;
}
