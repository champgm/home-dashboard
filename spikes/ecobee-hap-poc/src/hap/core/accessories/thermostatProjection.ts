import { HapCharacteristicType, HapServiceType, type AccessoryDatabase, type CharacteristicMetadata, type CharacteristicReadResponse, type FreshValue, type ProjectedCapability, type ThermostatProjection, type ValueSource } from './models';

const capabilityTypes = [
  ['currentTemperature', HapCharacteristicType.currentTemperature],
  ['currentRelativeHumidity', HapCharacteristicType.currentRelativeHumidity],
  ['targetTemperature', HapCharacteristicType.targetTemperature],
  ['targetHeatingCoolingState', HapCharacteristicType.targetHeatingCoolingState],
  ['currentHeatingCoolingState', HapCharacteristicType.currentHeatingCoolingState],
  ['temperatureDisplayUnits', HapCharacteristicType.temperatureDisplayUnits],
  ['heatingThresholdTemperature', HapCharacteristicType.heatingThresholdTemperature],
  ['coolingThresholdTemperature', HapCharacteristicType.coolingThresholdTemperature]
] as const;

export function projectThermostat(database: AccessoryDatabase): ThermostatProjection {
  const service = database.accessories.find((candidate) => candidate.type === HapServiceType.thermostat);
  if (!service) throw new Error('thermostat service is not exposed by target');
  const capabilities: ProjectedCapability[] = capabilityTypes.map(([key, type]) => {
    const characteristic = service.characteristics.find((candidate) => candidate.type === type);
    return characteristic
      ? { key, characteristic, status: 'available' }
      : { key, characteristic: missingMetadata(service.aid, type), status: 'unsupported' };
  });
  return { aid: service.aid, serviceIid: service.iid, capabilities };
}

export function applyCharacteristicReads(
  projection: ThermostatProjection,
  response: CharacteristicReadResponse,
  source: ValueSource,
  generation: number,
  observedAtEpochMs: number
): ThermostatProjection {
  const reads = new Map(response.characteristics.map((read) => [`${read.aid}.${read.iid}`, read]));
  return {
    ...projection,
    capabilities: projection.capabilities.map((capability) => {
      if (capability.status === 'unsupported') return capability;
      const key = `${capability.characteristic.aid}.${capability.characteristic.iid}`;
      const read = reads.get(key);
      if (!read) return { ...capability, status: 'read-failed', errorCategory: 'missing-read-result' };
      if (read.status !== undefined && read.status !== 0) return { ...capability, status: 'read-failed', errorCategory: `hap-status-${read.status}` };
      const value = validateCharacteristicValue(capability.characteristic, read.value);
      if (!value.ok) return { ...capability, status: 'invalid', errorCategory: value.error };
      return { ...capability, status: 'available', value: { value: value.value, source, observedAtEpochMs, generation } };
    })
  };
}

export function validateCharacteristicValue(metadata: CharacteristicMetadata, value: unknown): { ok: true; value: number | boolean | string } | { ok: false; error: string } {
  let normalized: number | boolean | string;
  switch (metadata.format) {
    case 'bool':
      if (typeof value !== 'boolean') return { ok: false, error: 'value-format-bool' };
      normalized = value;
      break;
    case 'string':
      if (typeof value !== 'string') return { ok: false, error: 'value-format-string' };
      if (metadata.maxLen !== undefined && value.length > metadata.maxLen) return { ok: false, error: 'value-max-length' };
      normalized = value;
      break;
    case 'float':
      if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, error: 'value-format-float' };
      normalized = value;
      break;
    default:
      if (typeof value !== 'number' || !Number.isInteger(value)) return { ok: false, error: 'value-format-integer' };
      normalized = value;
      break;
  }
  if (typeof normalized === 'number') {
    if (metadata.minValue !== undefined && normalized < metadata.minValue) return { ok: false, error: 'value-below-minimum' };
    if (metadata.maxValue !== undefined && normalized > metadata.maxValue) return { ok: false, error: 'value-above-maximum' };
    if (metadata.minStep !== undefined && metadata.minValue !== undefined) {
      const steps = (normalized - metadata.minValue) / metadata.minStep;
      if (Math.abs(steps - Math.round(steps)) > 1e-6) return { ok: false, error: 'value-off-step' };
    }
  }
  return { ok: true, value: normalized };
}

function missingMetadata(aid: number, type: string): CharacteristicMetadata {
  return { aid, iid: -1, type, format: 'float', perms: [], eventCapable: false };
}
