import { ThermostatReadService } from '../../src/application/thermostatService';
import { FakeClock } from '../fakes/clock';
import type { HapSessionApi } from '../../src/hap/ports/contracts';

describe('thermostat read service', () => {
  it('enumerates and reads only instance-ID based capabilities', async () => {
    const requestedPaths: string[] = [];
    const session: HapSessionApi = {
      generation: 3,
      request: async (_method, path) => {
        requestedPaths.push(path);
        return path === '/accessories'
          ? { statusCode: 200, headers: {}, body: new TextEncoder().encode(JSON.stringify({ accessories: [{ aid: 1, services: [{ iid: 2, type: '4A', characteristics: [{ iid: 3, type: '11', format: 'float', perms: ['pr'] }] }] }] })) }
          : { statusCode: 200, headers: {}, body: new TextEncoder().encode(JSON.stringify({ characteristics: [{ aid: 1, iid: 3, value: 20.5 }] })) };
      },
      close: async () => undefined
    };
    const projection = await new ThermostatReadService(new FakeClock()).refresh(session);
    expect(projection.capabilities.find((capability) => capability.key === 'currentTemperature')?.value?.value).toBe(20.5);
    expect(requestedPaths).toEqual(['/accessories', '/characteristics?id=1.3']);
  });

  it('reports a sanitized refresh stage without exposing response content', async () => {
    const session: HapSessionApi = {
      generation: 4,
      request: async () => ({ statusCode: 200, headers: {}, body: new TextEncoder().encode('not-json') }),
      close: async () => undefined
    };

    await expect(new ThermostatReadService(new FakeClock()).refresh(session)).rejects.toEqual(
      expect.objectContaining({ category: 'accessories-json-framing-invalid' })
    );
  });

  it('distinguishes an empty successful response from malformed JSON', async () => {
    const session: HapSessionApi = {
      generation: 5,
      request: async () => ({ statusCode: 200, headers: {}, body: new Uint8Array() }),
      close: async () => undefined
    };

    await expect(new ThermostatReadService(new FakeClock()).refresh(session)).rejects.toEqual(
      expect.objectContaining({ category: 'accessories-body-empty' })
    );
  });

  it.each([
    ['{"value":NaN}', 'accessories-json-nonfinite-nan'],
    ['{"value":Infinity}', 'accessories-json-nonfinite-infinity'],
    ['{"value":1,}', 'accessories-json-trailing-comma'],
    ['{"value":"bad\\q"}', 'accessories-json-invalid-escape'],
    ['{"one":1 "two":2}', 'accessories-json-object-separator-before-string-at-9-context-{qaaaq:n_qaaaq:n}']
  ])('classifies JSON-like embedded-device deviations without exposing content', async (body, category) => {
    const session: HapSessionApi = {
      generation: 6,
      request: async () => ({ statusCode: 200, headers: {}, body: new TextEncoder().encode(body) }),
      close: async () => undefined
    };

    await expect(new ThermostatReadService(new FakeClock()).refresh(session)).rejects.toEqual(
      expect.objectContaining({ category })
    );
  });
});
