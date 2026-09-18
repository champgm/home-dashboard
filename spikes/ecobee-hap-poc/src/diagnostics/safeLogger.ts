import type { SafeLogFields, SafeLogger } from '../hap/ports/contracts';

const ALLOWED_FIELDS = new Set([
  'phase',
  'operation',
  'result',
  'durationMs',
  'accessoryAlias',
  'addressFamily',
  'errorCategory',
  'retryCount',
  'generation',
  'transportState',
  'detail'
]);

const SETUP_CODE = /\b\d{3}-\d{2}-\d{3}\b/g;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const MAC = /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi;
const SECRET_FIELD = /\b(?:setupCode|privateKey|longTermSecretKey|sessionKey|pairingRecord|accessoryLTPK|controllerLTSK|proof|signature|nonce|encryptedData)\b/gi;
const HEX_SECRET = /\b(?:[0-9a-f]{64}|[0-9a-f]{96,})\b/gi;

export function redactSensitiveText(value: string): string {
  return value
    .replace(SETUP_CODE, '[setup-code]')
    .replace(IPV4, '[address]')
    .replace(MAC, '[hardware-id]')
    .replace(SECRET_FIELD, '[secret-field]')
    .replace(HEX_SECRET, '[opaque-bytes]');
}

export function assertSafeLogFields(fields: Record<string, unknown>): asserts fields is SafeLogFields {
  for (const key of Object.keys(fields)) {
    if (!ALLOWED_FIELDS.has(key)) throw new Error(`unknown diagnostic field: ${key}`);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && redactSensitiveText(value) !== value) {
      throw new Error(`sensitive diagnostic field: ${key}`);
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`non-finite diagnostic field: ${key}`);
    }
  }
}

export interface LogEntry {
  readonly level: 'info' | 'error';
  readonly name: string;
  readonly fields: SafeLogFields;
}

export class StructuredLogger implements SafeLogger {
  readonly entries: LogEntry[] = [];

  constructor(private readonly sink: (entry: LogEntry) => void = () => undefined) {}

  event(name: string, fields: SafeLogFields = {}): void {
    this.write('info', name, fields);
  }

  error(name: string, fields: SafeLogFields = {}): void {
    this.write('error', name, fields);
  }

  private write(level: LogEntry['level'], name: string, fields: SafeLogFields): void {
    if (!/^[a-z][a-z0-9_.-]{1,80}$/.test(name)) throw new Error('invalid diagnostic event name');
    assertSafeLogFields(fields);
    const entry = { level, name, fields: { ...fields } } satisfies LogEntry;
    this.entries.push(entry);
    this.sink(entry);
  }
}

export function sanitizedErrorCategory(error: unknown): string {
  if (error instanceof Error) return redactSensitiveText(error.name || 'Error').toLowerCase();
  return 'unknown-error';
}
