import { Diagnostic, DiagnosticCategory } from "./types";

export function diagnostic(
  category: DiagnosticCategory,
  message: string,
  details: Omit<Diagnostic, "category" | "message"> = {},
): Diagnostic {
  return { category, message, ...details };
}

export function diagnosticForError(error: unknown, operation?: string, resource?: string): Diagnostic {
  const category = errorCategory(error);
  return diagnostic(category, userMessage(category), { operation, resource });
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
