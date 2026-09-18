import { assertEvidenceSafe, sanitizeEvidenceText } from '../../src/diagnostics/evidenceScanner';
import { StructuredLogger } from '../../src/diagnostics/safeLogger';

describe('security and evidence audit helpers', () => {
  it('rejects arbitrary diagnostic payload fields', () => {
    const logger = new StructuredLogger();
    expect(() => logger.event('audit.bad', { detail: 'opaque-safe' })).not.toThrow();
    expect(() => logger.event('audit.bad', { detail: 'privateKey material' })).toThrow();
  });

  it('sanitizes a captured artifact before evidence persistence', () => {
    const sanitized = sanitizeEvidenceText('setupCode=123-45-678 address=192.168.1.2');
    expect(() => assertEvidenceSafe(sanitized)).not.toThrow();
  });
});
