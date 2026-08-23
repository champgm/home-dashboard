import { redactDiagnosticMessage } from "./redaction";

export type HueResponseKind = "success" | "partial_failure" | "definite_failure";

export interface HueErrorEntry {
  readonly type?: number | string;
  readonly address?: string;
  readonly description?: string;
  readonly [key: string]: unknown;
}

export interface HueResponseClassification<T = unknown> {
  readonly kind: HueResponseKind;
  readonly successes: T[];
  readonly errors: HueErrorEntry[];
  readonly value?: T;
}

export function classifyHueResponse<T = unknown>(payload: unknown): HueResponseClassification<T> {
  if (Array.isArray(payload)) {
    const successes: T[] = [];
    const errors: HueErrorEntry[] = [];
    payload.forEach((entry) => {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const record = entry as Record<string, unknown>;
        if (record.error && typeof record.error === "object") {
          errors.push(record.error as HueErrorEntry);
        }
        if (Object.prototype.hasOwnProperty.call(record, "success")) {
          successes.push(record.success as T);
        }
      }
    });
    const kind: HueResponseKind = errors.length === 0
      ? "success"
      : successes.length > 0
        ? "partial_failure"
        : "definite_failure";
    return { kind, successes, errors, value: successes.length === 1 ? successes[0] : undefined };
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (record.error && typeof record.error === "object") {
      return { kind: "definite_failure", successes: [], errors: [record.error as HueErrorEntry] };
    }
  }
  return { kind: "success", successes: payload === undefined ? [] : [payload as T], errors: [], value: payload as T };
}

export function hueResponseErrorMessage(classification: HueResponseClassification): string {
  return redactDiagnosticMessage(classification.errors
    .map((error) => error.description || "Hue rejected the operation.")
    .join("; ") || "Hue rejected the operation.");
}
