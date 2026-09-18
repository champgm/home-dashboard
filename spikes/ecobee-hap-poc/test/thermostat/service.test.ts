import { ThermostatReadService } from '../../src/application/thermostatService';
import { FakeClock } from '../fakes/clock';
import type { HapSessionApi } from '../../src/hap/ports/contracts';

describe('thermostat read service', () => {
  it('enumerates and reads only instance-ID based capabilities', async () => {
    const session: HapSessionApi = {
      generation: 3,
      request: async (_method, path) => path === '/accessories'
        ? { statusCode: 200, headers: {}, body: new TextEncoder().encode(JSON.stringify({ accessories: [{ aid: 1, services: [{ iid: 2, type: '4A', characteristics: [{ iid: 3, type: '11', format: 'float', perms: ['pr'] }] }] }] })) }
        : { statusCode: 200, headers: {}, body: new TextEncoder().encode(JSON.stringify({ characteristics: [{ aid: 1, iid: 3, value: 20.5 }] })) },
      close: async () => undefined
    };
    const projection = await new ThermostatReadService(new FakeClock()).refresh(session);
    expect(projection.capabilities.find((capability) => capability.key === 'currentTemperature')?.value?.value).toBe(20.5);
  });
});
