const HUE_PATH_CREDENTIAL = /\/api\/[^/\s"']+/gi;
const AUTHORIZATION_FIELD = /(authorization|credential|username|user(name)?|token)\s*([=:])\s*["']?[^,\s"'}]+/gi;

export function redactHueCredential(value: string): string {
  return value
    .replace(HUE_PATH_CREDENTIAL, "/api/<redacted>")
    .replace(AUTHORIZATION_FIELD, (_match, field: string, _usernameSuffix: string | undefined, separator: string) => `${field}${separator}<redacted>`);
}

export function redactDiagnosticMessage(value: unknown): string {
  return redactHueCredential(typeof value === "string" ? value : "Device operation failed.");
}

export function stripCredentialBearingPath(path: string): string {
  return path.replace(HUE_PATH_CREDENTIAL, "/api/<redacted>");
}
