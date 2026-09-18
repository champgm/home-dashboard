import { assertSafeLogFields, StructuredLogger } from '../../src/diagnostics/safeLogger';

describe('safe diagnostics', () => {
  it('accepts the allowlisted fields and retains structured entries', () => {
    const logger = new StructuredLogger();
    logger.event('discovery.started', { phase: '01', result: 'started', durationMs: 4 });
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0].fields).toEqual({ phase: '01', result: 'started', durationMs: 4 });
  });

  it('rejects unknown fields and sensitive values before serialization', () => {
    expect(() => assertSafeLogFields({ raw: 'anything' })).toThrow('unknown diagnostic field');
    expect(() => assertSafeLogFields({ detail: 'setupCode=123-45-678' })).toThrow('sensitive diagnostic field');
  });
});
