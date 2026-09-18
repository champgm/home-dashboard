const forbiddenPatterns: readonly [string, RegExp][] = [
  ['setup-code', /\b\d{3}-\d{2}-\d{3}\b/],
  ['ipv4-address', /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ['mac-address', /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/i],
  ['secret-field', /\b(?:setupCode|privateKey|longTermSecretKey|sessionKey|pairingRecord|encryptedData)\b/i],
  ['long-hex-secret', /\b[0-9a-f]{64,}\b/i]
];

export interface EvidenceFinding {
  readonly kind: string;
  readonly line: number;
}

export function scanEvidenceText(text: string): EvidenceFinding[] {
  const findings: EvidenceFinding[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [kind, pattern] of forbiddenPatterns) {
      if (pattern.test(line)) findings.push({ kind, line: index + 1 });
      pattern.lastIndex = 0;
    }
  });
  return findings;
}

export function assertEvidenceSafe(text: string): void {
  const findings = scanEvidenceText(text);
  if (findings.length) {
    throw new Error(findings.map((finding) => `${finding.kind}@${finding.line}`).join(', '));
  }
}

export function sanitizeEvidenceText(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{3}\b/g, '[setup-code]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[address]')
    .replace(/\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi, '[hardware-id]')
    .replace(/\b(?:setupCode|privateKey|longTermSecretKey|sessionKey|pairingRecord|encryptedData)\b/gi, '[secret-field]')
    .replace(/\b[0-9a-f]{64,}\b/gi, '[opaque-bytes]');
}
