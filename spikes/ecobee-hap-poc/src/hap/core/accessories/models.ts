export const HAP_BASE_UUID = '-0000-1000-8000-0026bb765291';

export const HapServiceType = {
  thermostat: `0000004A${HAP_BASE_UUID}`.toLowerCase()
} as const;

export const HapCharacteristicType = {
  currentHeatingCoolingState: `0000000F${HAP_BASE_UUID}`.toLowerCase(),
  currentTemperature: `00000011${HAP_BASE_UUID}`.toLowerCase(),
  currentRelativeHumidity: `00000010${HAP_BASE_UUID}`.toLowerCase(),
  targetHeatingCoolingState: `00000033${HAP_BASE_UUID}`.toLowerCase(),
  targetTemperature: `00000035${HAP_BASE_UUID}`.toLowerCase(),
  temperatureDisplayUnits: `00000036${HAP_BASE_UUID}`.toLowerCase(),
  heatingThresholdTemperature: `00000012${HAP_BASE_UUID}`.toLowerCase(),
  coolingThresholdTemperature: `00000013${HAP_BASE_UUID}`.toLowerCase()
} as const;

export type CharacteristicFormat = 'bool' | 'uint8' | 'uint16' | 'uint32' | 'int' | 'float' | 'string' | 'tlv8' | 'data';

export interface CharacteristicMetadata {
  readonly aid: number;
  readonly iid: number;
  readonly type: string;
  readonly format: CharacteristicFormat;
  readonly perms: readonly ('pr' | 'pw' | 'ev' | 'aa' | 'tw' | 'hd')[];
  readonly unit?: string;
  readonly minValue?: number;
  readonly maxValue?: number;
  readonly minStep?: number;
  readonly maxLen?: number;
  readonly eventCapable: boolean;
}

export interface AccessoryService {
  readonly aid: number;
  readonly iid: number;
  readonly type: string;
  readonly characteristics: readonly CharacteristicMetadata[];
}

export interface AccessoryDatabase {
  readonly accessories: readonly AccessoryService[];
}

export interface CharacteristicRead {
  readonly aid: number;
  readonly iid: number;
  readonly value?: unknown;
  readonly status?: number;
}

export interface CharacteristicReadResponse {
  readonly characteristics: readonly CharacteristicRead[];
}

export type ValueSource = 'initial-read' | 'event' | 'poll' | 'reconciliation-read';

export interface FreshValue {
  readonly value: number | boolean | string;
  readonly source: ValueSource;
  readonly observedAtEpochMs: number;
  readonly generation: number;
}

export interface ProjectedCapability {
  readonly key: 'currentTemperature' | 'currentRelativeHumidity' | 'targetTemperature' | 'targetHeatingCoolingState' | 'currentHeatingCoolingState' | 'temperatureDisplayUnits' | 'heatingThresholdTemperature' | 'coolingThresholdTemperature';
  readonly characteristic: CharacteristicMetadata;
  readonly value?: FreshValue;
  readonly status: 'available' | 'unsupported' | 'invalid' | 'read-failed';
  readonly errorCategory?: string;
}

export interface ThermostatProjection {
  readonly aid: number;
  readonly serviceIid: number;
  readonly capabilities: readonly ProjectedCapability[];
}

export function normalizeHapUuid(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (/^[0-9a-f]{1,8}$/.test(normalized)) return `${normalized.padStart(8, '0')}${HAP_BASE_UUID}`;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) return normalized;
  throw new Error('invalid HAP UUID');
}
