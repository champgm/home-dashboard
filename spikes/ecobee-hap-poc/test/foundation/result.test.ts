import { err, failure, ok } from '../../src/application/result';

describe('result and failure vocabulary', () => {
  it('keeps success and failure discriminated', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
    expect(err(failure('timeout', 'transport-timeout', { retryable: true }))).toEqual({
      ok: false,
      error: { code: 'timeout', category: 'transport-timeout', retryable: true, repairRequired: false, possibleSend: false }
    });
  });
});
