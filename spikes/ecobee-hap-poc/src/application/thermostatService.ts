import type { Clock, HapSessionApi, SafeLogger } from '../hap/ports/contracts';
import { parseAccessoryDatabase, parseCharacteristicReadResponse } from '../hap/core/accessories/enumeration';
import { applyCharacteristicReads, projectThermostat } from '../hap/core/accessories/thermostatProjection';
import type { ThermostatProjection } from '../hap/core/accessories/models';

export class ThermostatReadService {
  constructor(private readonly clock: Clock, private readonly logger?: SafeLogger) {}

  async refresh(session: HapSessionApi): Promise<ThermostatProjection> {
    const databaseResponse = await session.request('GET', '/accessories');
    if (databaseResponse.statusCode !== 200) throw new Error(`accessory enumeration returned status ${databaseResponse.statusCode}`);
    const projection = projectThermostat(parseAccessoryDatabase(JSON.parse(new TextDecoder().decode(databaseResponse.body))));
    const readable = projection.capabilities.filter((capability) => capability.status === 'available' && capability.characteristic.iid > 0 && capability.characteristic.perms.includes('pr'));
    if (readable.length === 0) throw new Error('thermostat has no readable projected characteristics');
    const ids = readable.map((capability) => `${capability.characteristic.aid}.${capability.characteristic.iid}`).join(',');
    const path = `/characteristics?id=${ids}&meta=1&perms=1&type=1&ev=1`;
    const response = await session.request('GET', path);
    if (response.statusCode !== 200 && response.statusCode !== 207) throw new Error(`characteristic read returned status ${response.statusCode}`);
    const next = applyCharacteristicReads(projection, parseCharacteristicReadResponse(JSON.parse(new TextDecoder().decode(response.body))), 'initial-read', session.generation, this.clock.now());
    this.logger?.event('thermostat.read-refresh', { operation: 'thermostat-read', result: 'success', generation: session.generation });
    return next;
  }
}
