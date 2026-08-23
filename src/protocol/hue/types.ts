import { CommandResult, HueSnapshot, ResourceKind } from "../../app/types";

export type HueOperationName = "read" | "create" | "update" | "delete" | "action" | "search" | "provision";

export interface HueAdapterResult<T = unknown> extends CommandResult<T> {
  readonly kind: CommandResult["kind"];
}

export interface HueResourceRecord {
  readonly id: string;
  readonly kind: ResourceKind;
  readonly raw: Record<string, unknown>;
}

export type { HueSnapshot };
