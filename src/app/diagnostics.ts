import { redactDiagnosticMessage } from "../protocol/hue/redaction";
import { Diagnostic, DiagnosticCategory } from "./types";

const MAX_DETAIL_LENGTH = 240;

export function diagnostic(
  category: DiagnosticCategory,
  message: string,
  details: Omit<Diagnostic, "category" | "message"> = {},
): Diagnostic {
  return {
    ...details,
    category,
    message: redactDiagnosticMessage(message),
    ...(details.detail ? { detail: redactAndBound(details.detail) } : {}),
    ...(details.resource ? { resource: redactAndBound(details.resource) } : {}),
  };
}

export function diagnosticForError(error: unknown, operation?: string, resource?: string): Diagnostic {
  const category = errorCategory(error);
  const record = asErrorRecord(error);
  const protocolCode = firstHueProtocolCode(record?.errors);
  const statusCode = typeof record?.status === "number"
    ? record.status
    : typeof record?.statusCode === "number" ? record.statusCode : undefined;
  const detail = record?.message || record?.description;
  return diagnostic(category, userMessage(category), {
    operation,
    resource,
    statusCode,
    protocolCode,
    ...(detail ? { detail: redactAndBound(detail) } : {}),
  });
}

function asErrorRecord(error: unknown): Record<string, any> | undefined {
  return error && typeof error === "object" ? error as Record<string, any> : undefined;
}

function firstHueProtocolCode(errors: unknown): number | string | undefined {
  if (!Array.isArray(errors)) return undefined;
  const first = errors[0];
  if (!first || typeof first !== "object") return undefined;
  const code = (first as Record<string, unknown>).type;
  return typeof code === "number" || typeof code === "string" ? code : undefined;
}

function redactAndBound(value: string): string {
  const redacted = redactDiagnosticMessage(value);
  return redacted.length > MAX_DETAIL_LENGTH ? `${redacted.slice(0, MAX_DETAIL_LENGTH - 1)}…` : redacted;
}

export function errorCategory(error: unknown): DiagnosticCategory {
  if (error && typeof error === "object") {
    const value = error as { category?: unknown; code?: unknown; name?: unknown };
    if (isDiagnosticCategory(value.category)) {
      return value.category;
    }
    if (value.code === "ETIMEDOUT" || value.name === "AbortError") {
      return "Timeout";
    }
    if (value.code === "EACCES" || value.code === "PERMISSION_DENIED") {
      return "PermissionDenied";
    }
    if (value.code === "CONFIG_CORRUPT") {
      return "ConfigCorrupt";
    }
  }
  return "NetworkUnavailable";
}

function isDiagnosticCategory(value: unknown): value is DiagnosticCategory {
  return [
    "Busy", "NetworkUnavailable", "Timeout", "ProtocolMalformed", "ProtocolRejected",
    "AuthenticationRejected", "BridgeIdentityMismatch", "PermissionDenied", "StorageError",
    "ConfigCorrupt", "Ambiguous", "Unknown",
  ].includes(value as DiagnosticCategory);
}

export function userMessage(category: DiagnosticCategory): string {
  switch (category) {
    case "Busy": return "This device is already handling another operation.";
    case "NetworkUnavailable": return "The local device could not be reached.";
    case "Timeout": return "The local device did not finish before the five-second deadline.";
    case "ProtocolMalformed": return "The device returned an invalid response.";
    case "ProtocolRejected": return "The device rejected the requested operation.";
    case "AuthenticationRejected": return "Hue authorization was rejected. Reauthorize this bridge.";
    case "BridgeIdentityMismatch": return "The configured endpoint is not the permanently bound Hue bridge.";
    case "PermissionDenied": return "Android denied local-network access.";
    case "StorageError": return "Local storage is unavailable; no change was reported as saved.";
    case "ConfigCorrupt": return "Local configuration is unreadable. Reset it explicitly to continue.";
    case "Ambiguous": return "The operation may have reached the device; refresh and retry manually if needed.";
    default: return "The current device state is unknown.";
  }
}
