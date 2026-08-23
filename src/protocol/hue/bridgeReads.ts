const SENSITIVE_KEYS = new Set(["username", "whitelist", "credential", "authorization", "token", "password"]);

export function redactBridgeRead(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactBridgeRead);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.keys(value as Record<string, unknown>).reduce((result, key) => {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      return result;
    }
    result[key] = redactBridgeRead((value as Record<string, unknown>)[key]);
    return result;
  }, {} as Record<string, unknown>);
}

export interface BridgeReadDto {
  readonly config: Record<string, unknown>;
  readonly capabilities?: Record<string, unknown>;
}

export function toBridgeReadDto(config: unknown, capabilities?: unknown): BridgeReadDto {
  return {
    config: (redactBridgeRead(config) || {}) as Record<string, unknown>,
    capabilities: capabilities === undefined ? undefined : redactBridgeRead(capabilities) as Record<string, unknown>,
  };
}
