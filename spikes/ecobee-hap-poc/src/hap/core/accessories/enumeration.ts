import type { AccessoryDatabase, AccessoryService, CharacteristicMetadata, CharacteristicReadResponse } from './models';
import { normalizeHapUuid } from './models';

const FORMATS = new Set(['bool', 'uint8', 'uint16', 'uint32', 'uint64', 'int', 'float', 'string', 'tlv8', 'data']);
const PERMISSIONS = new Set(['pr', 'pw', 'ev', 'aa', 'tw', 'hd', 'wr']);

export function parseAccessoryDatabase(input: unknown): AccessoryDatabase {
  if (!isRecord(input) || !Array.isArray(input.accessories)) throw new Error('accessory database is malformed');
  const accessories: AccessoryService[] = [];
  for (const rawAccessory of input.accessories) {
    if (!isRecord(rawAccessory) || !isPositiveInteger(rawAccessory.aid) || !Array.isArray(rawAccessory.services)) throw new Error('accessory entry is malformed');
    for (const rawService of rawAccessory.services) {
      if (!isRecord(rawService) || !isPositiveInteger(rawService.iid) || typeof rawService.type !== 'string' || !Array.isArray(rawService.characteristics)) throw new Error('service entry is malformed');
      const characteristics = rawService.characteristics.flatMap((rawCharacteristic) => {
        const parsed = parseCharacteristic(rawAccessory.aid as number, rawCharacteristic);
        return parsed ? [parsed] : [];
      });
      accessories.push({ aid: rawAccessory.aid, iid: rawService.iid, type: normalizeHapUuid(rawService.type), characteristics });
    }
  }
  return { accessories };
}

export function parseCharacteristicReadResponse(input: unknown): CharacteristicReadResponse {
  if (!isRecord(input) || !Array.isArray(input.characteristics)) throw new Error('characteristic read response is malformed');
  const characteristics = input.characteristics.map((raw) => {
    if (!isRecord(raw) || !isPositiveInteger(raw.aid) || !isPositiveInteger(raw.iid)) throw new Error('characteristic read entry is malformed');
    if (raw.status !== undefined && (typeof raw.status !== 'number' || !Number.isInteger(raw.status))) throw new Error('characteristic status is malformed');
    return { aid: raw.aid, iid: raw.iid, value: raw.value, status: raw.status };
  });
  return { characteristics };
}

function parseCharacteristic(aid: number, raw: unknown): CharacteristicMetadata | undefined {
  if (!isRecord(raw) || !isPositiveInteger(raw.iid) || typeof raw.type !== 'string' || typeof raw.format !== 'string' || !Array.isArray(raw.perms)) throw new Error('characteristic metadata is malformed');
  if (!FORMATS.has(raw.format)) return undefined;
  const perms = raw.perms.filter((permission): permission is CharacteristicMetadata['perms'][number] => typeof permission === 'string' && PERMISSIONS.has(permission));
  const numericFields = ['minValue', 'maxValue', 'minStep', 'maxLen'] as const;
  for (const field of numericFields) if (raw[field] !== undefined && typeof raw[field] !== 'number') throw new Error(`invalid characteristic ${field}`);
  return {
    aid,
    iid: raw.iid,
    type: normalizeHapUuid(raw.type),
    format: raw.format as CharacteristicMetadata['format'],
    perms,
    unit: typeof raw.unit === 'string' ? raw.unit : undefined,
    minValue: raw.minValue as number | undefined,
    maxValue: raw.maxValue as number | undefined,
    minStep: raw.minStep as number | undefined,
    maxLen: raw.maxLen as number | undefined,
    eventCapable: perms.includes('ev')
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
