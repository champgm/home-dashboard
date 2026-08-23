export const DEFAULT_TPLINK_PORT = 9999;

export type EndpointValidationCode =
  | "missing-ipv4"
  | "invalid-ipv4"
  | "non-private-ipv4"
  | "invalid-port";

export class EndpointValidationError extends Error {
  readonly code: EndpointValidationCode;

  constructor(code: EndpointValidationCode, message: string) {
    super(message);
    this.name = "EndpointValidationError";
    this.code = code;
  }
}

export interface EndpointValidationResult {
  readonly valid: boolean;
  readonly value?: string;
  readonly error?: EndpointValidationError;
}

function octets(value: string): number[] | undefined {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
    return undefined;
  }
  const parts = value.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) {
    return undefined;
  }
  const result = parts.map((part) => Number(part));
  if (result.some((part) => part < 0 || part > 255 || !Number.isInteger(part))) {
    return undefined;
  }
  return result;
}

export function isValidIpv4(value: unknown): value is string {
  return typeof value === "string" && octets(value) !== undefined;
}

export function isPrivateLocalIpv4(value: unknown): value is string {
  if (!isValidIpv4(value)) {
    return false;
  }
  const parts = octets(value)!;
  const [first, second] = parts;
  const isRfc1918 = first === 10
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
  const isLinkLocal = first === 169 && second === 254;
  const isLoopback = first === 127;
  const isUnspecified = first === 0;
  const isMulticast = first >= 224;
  const isBroadcast = parts[3] === 255;
  return (isRfc1918 || isLinkLocal) && !isLoopback && !isUnspecified && !isMulticast && !isBroadcast;
}

// Kept as a short alias because endpoint checks are used by both adapters.
export const isPrivateIpv4 = isPrivateLocalIpv4;

export function validatePrivateIpv4(value: unknown): EndpointValidationResult {
  if (value === undefined || value === null || value === "") {
    return {
      valid: false,
      error: new EndpointValidationError("missing-ipv4", "Enter a private IPv4 address."),
    };
  }
  if (!isValidIpv4(value)) {
    return {
      valid: false,
      error: new EndpointValidationError("invalid-ipv4", "Enter a literal IPv4 address."),
    };
  }
  if (!isPrivateLocalIpv4(value)) {
    return {
      valid: false,
      error: new EndpointValidationError(
        "non-private-ipv4",
        "The endpoint must be a private/local IPv4 address.",
      ),
    };
  }
  return { valid: true, value };
}

export function assertPrivateIpv4(value: unknown): asserts value is string {
  const result = validatePrivateIpv4(value);
  if (!result.valid) {
    throw result.error;
  }
}

export function validatePort(value: unknown, defaultPort = DEFAULT_TPLINK_PORT): number {
  if (value === undefined || value === null || value === "") {
    return defaultPort;
  }
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 65535) {
    throw new EndpointValidationError("invalid-port", "TCP port must be an integer from 1 through 65535.");
  }
  return numberValue;
}

export interface ValidatedPlugEndpoint {
  readonly id: string;
  readonly ipv4: string;
  readonly port: number;
}

export function validatePlugEndpoint(input: {
  readonly id?: unknown;
  readonly ipv4?: unknown;
  readonly port?: unknown;
}): ValidatedPlugEndpoint {
  const address = validatePrivateIpv4(input.ipv4);
  if (!address.valid) {
    throw address.error;
  }
  const id = typeof input.id === "string" && input.id.length > 0 ? input.id : createEndpointId(address.value!);
  return { id, ipv4: address.value!, port: validatePort(input.port) };
}

export function createEndpointId(ipv4: string): string {
  return `plug-${ipv4.replace(/\./g, "-")}`;
}
