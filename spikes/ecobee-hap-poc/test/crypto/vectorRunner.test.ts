import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import { runCryptoVectorSuite } from '../../src/hap/crypto/vectorRunner';

describe('sanitized crypto vector runner', () => {
  it('returns pass/fail counts without returning bytes or secret material', async () => {
    const result = await runCryptoVectorSuite(new SodiumCryptoProvider());
    expect(result.failed).toBe(0);
    expect(result.passed).toBeGreaterThanOrEqual(6);
    expect(JSON.stringify(result)).not.toMatch(/private|session|nonce|key material/i);
  });
});
