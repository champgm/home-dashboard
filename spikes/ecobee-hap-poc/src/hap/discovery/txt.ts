import type { RawDnsSdService } from '../ports/contracts';

/** HAP accessory category 9 is the only category accepted by this thermostat POC. */
export const HAP_THERMOSTAT_CATEGORY = 9;

/**
 * HAP categories known to describe something other than a thermostat.
 *
 * The coordinator still rejects every category other than 9, including future
 * or otherwise unknown numeric values. This set only gives the rejection a
 * more useful diagnostic classification.
 */
export const KNOWN_NON_THERMOSTAT_CATEGORIES: ReadonlySet<number> = new Set([
  1, 2, 3, 4, 5, 6, 7, 8,
  10, 11, 12, 13, 14, 15, 16, 17, 18,
  19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 31, 32
]);

export type HapCategoryDisposition =
  | 'thermostat'
  | 'category-missing'
  | 'known-non-thermostat-category'
  | 'unsupported-category';

export function classifyHapCategory(category: number | undefined): HapCategoryDisposition {
  if (category === HAP_THERMOSTAT_CATEGORY) return 'thermostat';
  if (category === undefined) return 'category-missing';
  if (KNOWN_NON_THERMOSTAT_CATEGORIES.has(category)) return 'known-non-thermostat-category';
  return 'unsupported-category';
}

export interface HapTxtRecord {
  readonly configurationNumber: number;
  readonly featureFlags: number;
  readonly accessoryId: string;
  readonly model?: string;
  readonly protocolVersion: string;
  readonly stateNumber: number;
  readonly category?: number;
  readonly pairingAvailable: boolean;
}

export function parseHapTxt(service: Pick<RawDnsSdService, 'type' | 'txt'>): HapTxtRecord {
  if (normalizeServiceType(service.type) !== '_hap._tcp') throw new Error('unexpected DNS-SD service type');
  const txt = service.txt;
  const configurationNumber = parseRequiredInteger(txt['c#'], 'c#');
  const featureFlags = parseOptionalInteger(txt.ff, 0, 'ff') ?? 0;
  const stateNumber = parseRequiredInteger(txt['s#'], 's#');
  if (typeof txt.id !== 'string' || txt.id.length < 3 || txt.id.length > 80) throw new Error('HAP TXT identity is missing');
  if (typeof txt.pv !== 'string' || txt.pv.length === 0 || txt.pv.length > 16) throw new Error('HAP TXT protocol version is missing');
  return {
    configurationNumber,
    featureFlags,
    accessoryId: txt.id,
    model: typeof txt.md === 'string' && txt.md.length <= 80 ? txt.md : undefined,
    protocolVersion: txt.pv,
    stateNumber,
    category: txt.ci === undefined ? undefined : parseOptionalInteger(txt.ci, undefined, 'ci'),
    pairingAvailable: ((parseOptionalInteger(txt.sf, 0, 'sf') ?? 0) & 0x01) !== 0
  };
}

export function normalizeServiceType(type: string): string {
  return type.toLowerCase().replace(/\.$/, '');
}

function parseRequiredInteger(value: string | undefined, name: string): number {
  const parsed = parseOptionalInteger(value, undefined, name);
  if (parsed === undefined) throw new Error(`HAP TXT ${name} is missing`);
  return parsed;
}

function parseOptionalInteger(value: string | undefined, fallback: number | undefined, name: string): number | undefined {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`HAP TXT ${name} is not an integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`HAP TXT ${name} is out of range`);
  return parsed;
}
