import type { SecureValueStore } from '../hap/ports/contracts';
import { createInitialTargetRunStatus, type TargetRunEvidence, type TargetRunResult } from '../ui/PocControllerScreen';

const TARGET_RUN_KEY = 'ecobee-hap-poc.v1.target-run';
const RESULTS: readonly TargetRunResult[] = ['PENDING TARGET', 'PASS', 'FAIL', 'BLOCKED'];

/** Persists only allowlisted result categories; no operator notes or raw observations are accepted. */
export class TargetRunEvidenceStore {
  constructor(private readonly store: SecureValueStore) {}

  async load(): Promise<readonly TargetRunEvidence[] | undefined> {
    let raw: string | null;
    try {
      raw = await this.store.get(TARGET_RUN_KEY);
    } catch {
      return undefined;
    }
    if (!raw) return undefined;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return undefined;
      const saved = new Map<string, TargetRunResult>();
      parsed.forEach((entry) => {
        if (!isRecord(entry) || typeof entry.id !== 'string' || !RESULTS.includes(entry.result as TargetRunResult)) return;
        saved.set(entry.id, entry.result as TargetRunResult);
      });
      return createInitialTargetRunStatus().evidence.map((item) => {
        const result = saved.get(item.id);
        return result ? { ...item, result, summary: summaryFor(item, result) } : item;
      });
    } catch {
      return undefined;
    }
  }

  async save(evidence: readonly TargetRunEvidence[]): Promise<void> {
    await this.store.set(TARGET_RUN_KEY, JSON.stringify(evidence.map(({ id, result }) => ({ id, result }))));
  }
}

export function summaryFor(evidence: Pick<TargetRunEvidence, 'label'>, result: TargetRunResult): string {
  if (result === 'PASS') return `${evidence.label}: operator recorded a physical pass; attach the sanitized procedure record.`;
  if (result === 'FAIL') return `${evidence.label}: operator recorded a physical failure; preserve the run as evidence.`;
  if (result === 'BLOCKED') return `${evidence.label}: operator recorded an external prerequisite blocker.`;
  return `${evidence.label}: awaiting a physical target result.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
