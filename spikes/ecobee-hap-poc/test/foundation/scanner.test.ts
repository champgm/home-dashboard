import { assertEvidenceSafe, sanitizeEvidenceText, scanEvidenceText } from '../../src/diagnostics/evidenceScanner';

describe('evidence scanner', () => {
  it('finds secret-shaped values and field names', () => {
    const findings = scanEvidenceText('setupCode=123-45-678\nprivateKey=deadbeef');
    expect(findings.map((finding) => finding.kind)).toEqual(['setup-code', 'secret-field', 'secret-field']);
  });

  it('sanitizes evidence without exposing the original value', () => {
    const safe = sanitizeEvidenceText('setupCode=123-45-678 address=192.168.1.40');
    expect(safe).toBe('[secret-field]=[setup-code] address=[address]');
    expect(() => assertEvidenceSafe(safe)).not.toThrow();
  });
});
