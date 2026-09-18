import { TargetRunEvidenceStore, summaryFor } from '../../src/application/targetRunEvidence';
import { createInitialTargetRunStatus } from '../../src/ui/PocControllerScreen';
import { MemorySecureValueStore } from '../fakes/memoryStore';

describe('sanitized target-run evidence', () => {
  it('persists only allowlisted result categories', async () => {
    const store = new MemorySecureValueStore();
    const evidenceStore = new TargetRunEvidenceStore(store);
    const initial = createInitialTargetRunStatus().evidence;
    const evidence = initial.map((item) => item.id === 'HAP-001'
      ? { ...item, result: 'PASS' as const, summary: summaryFor(item, 'PASS') }
      : item);

    await evidenceStore.save(evidence);
    const saved = JSON.parse([...store.values.values()][0]) as Array<Record<string, unknown>>;
    expect(saved.find((item) => item.id === 'HAP-001')).toEqual({ id: 'HAP-001', result: 'PASS' });
    expect(saved[0]!).not.toHaveProperty('summary');
    const loaded = await evidenceStore.load();
    expect(loaded?.find((item) => item.id === 'HAP-001')?.result).toBe('PASS');
  });
});
