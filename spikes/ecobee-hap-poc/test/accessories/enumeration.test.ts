import { parseAccessoryDatabase, parseCharacteristicReadResponse } from '../../src/hap/core/accessories/enumeration';
import { HapCharacteristicType, HapServiceType } from '../../src/hap/core/accessories/models';
import { applyCharacteristicReads, projectThermostat, validateCharacteristicValue } from '../../src/hap/core/accessories/thermostatProjection';

describe('instance-ID based thermostat projection', () => {
  const database = {
    accessories: [{ aid: 1, services: [{ iid: 2, type: '4A', characteristics: [
      { iid: 3, type: '11', format: 'float', unit: 'celsius', minValue: 0, maxValue: 50, minStep: 0.1, perms: ['pr', 'ev'] },
      { iid: 4, type: '35', format: 'float', unit: 'celsius', minValue: 10, maxValue: 35, minStep: 0.5, perms: ['pr', 'pw', 'ev'] },
      { iid: 5, type: '10', format: 'float', unit: 'percentage', minValue: 0, maxValue: 100, perms: ['pr'] }
    ] }] }]
  };

  it('normalizes HAP short UUIDs and never uses display names', () => {
    const parsed = parseAccessoryDatabase(database);
    expect(parsed.accessories[0].type).toBe(HapServiceType.thermostat);
    expect(parsed.accessories[0].characteristics[0].type).toBe(HapCharacteristicType.currentTemperature);
    const projection = projectThermostat(parsed);
    expect(projection.capabilities.find((capability) => capability.key === 'currentTemperature')?.characteristic.iid).toBe(3);
    expect(projection.capabilities.find((capability) => capability.key === 'targetTemperature')?.characteristic.iid).toBe(4);
    expect(projection.capabilities.find((capability) => capability.key === 'targetHeatingCoolingState')?.status).toBe('unsupported');
  });

  it('validates metadata constraints and records freshness/source', () => {
    const projection = projectThermostat(parseAccessoryDatabase(database));
    const response = parseCharacteristicReadResponse({ characteristics: [{ aid: 1, iid: 3, value: 21.4 }, { aid: 1, iid: 4, value: 22.5 }, { aid: 1, iid: 5, value: 45 }] });
    const next = applyCharacteristicReads(projection, response, 'initial-read', 7, 123);
    expect(next.capabilities.find((capability) => capability.key === 'currentTemperature')?.value).toEqual({ value: 21.4, source: 'initial-read', observedAtEpochMs: 123, generation: 7 });
    expect(validateCharacteristicValue(next.capabilities.find((capability) => capability.key === 'targetTemperature')!.characteristic, 22.4)).toEqual({ ok: false, error: 'value-off-step' });
  });

  it('keeps unknown services and malformed per-characteristic values distinguishable', () => {
    expect(() => parseAccessoryDatabase({ accessories: [{ aid: 1, services: [{ iid: 2, type: '4A', characteristics: [{ iid: 3, type: '11', format: 'float', perms: ['pr'] }] }] }] })).not.toThrow();
    const projection = projectThermostat(parseAccessoryDatabase(database));
    const next = applyCharacteristicReads(projection, { characteristics: [{ aid: 1, iid: 3, value: 'unknown' }] }, 'initial-read', 1, 1);
    expect(next.capabilities.find((capability) => capability.key === 'currentTemperature')).toMatchObject({ status: 'invalid', errorCategory: 'value-format-float' });
  });
});
