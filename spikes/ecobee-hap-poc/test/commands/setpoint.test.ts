import { SetpointCommandService, selectWritableSetpoint, validateSetpoint, type SetpointWriter } from '../../src/application/setpointCommand';
import { parseAccessoryDatabase } from '../../src/hap/core/accessories/enumeration';
import { projectThermostat } from '../../src/hap/core/accessories/thermostatProjection';
import type { HapSessionApi } from '../../src/hap/ports/contracts';

const projection = projectThermostat(parseAccessoryDatabase({ accessories: [{ aid: 1, services: [{ iid: 2, type: '4A', characteristics: [
  { iid: 3, type: '11', format: 'float', unit: 'celsius', minValue: 0, maxValue: 50, minStep: 0.1, perms: ['pr'] },
  { iid: 4, type: '35', format: 'float', unit: 'celsius', minValue: 10, maxValue: 35, minStep: 0.5, perms: ['pr', 'pw'] }
] }] }] }));
const session = { generation: 2 } as HapSessionApi;

describe('safe setpoint command', () => {
  it('selects only a writable target representation and validates occupied-safe bounds/step', () => {
    expect(selectWritableSetpoint(projection, 1).ok).toBe(true);
    expect(validateSetpoint(projection.capabilities.find((capability) => capability.key === 'targetTemperature')!.characteristic, 22.4, { min: 16, max: 30, unit: 'celsius' })).toEqual({ ok: false, error: expect.objectContaining({ code: 'invalid_input', category: 'setpoint-value-off-step' }) });
    expect(validateSetpoint(projection.capabilities.find((capability) => capability.key === 'targetTemperature')!.characteristic, 31, { min: 16, max: 30, unit: 'celsius' })).toEqual({ ok: false, error: expect.objectContaining({ category: 'setpoint-outside-occupied-safe-range' }) });
  });

  it('confirms through read-back and never replays a possible-send write', async () => {
    let writes = 0;
    const writer: SetpointWriter = {
      async read() { return { kind: 'value', value: writes === 0 ? 21 : 22 }; },
      async write() { writes += 1; return { kind: 'possible-send', errorCategory: 'possible-send' }; }
    };
    const result = await new SetpointCommandService(writer).execute(session, projection, 22, { min: 16, max: 30, unit: 'celsius' }, true, 1);
    expect(result.ok && result.value).toMatchObject({ status: 'confirmed', reconciledFromPossibleSend: true, automaticReplay: false, before: 21, after: 22 });
    expect(writes).toBe(1);
  });

  it('keeps a mismatch ambiguous when transmission may have occurred', async () => {
    const writer: SetpointWriter = {
      async read() { return { kind: 'value', value: 21 }; },
      async write() { return { kind: 'possible-send' }; }
    };
    const result = await new SetpointCommandService(writer).execute(session, projection, 22, { min: 16, max: 30, unit: 'celsius' }, true, 1);
    expect(result.ok && result.value.status).toBe('ambiguous');
  });
});
