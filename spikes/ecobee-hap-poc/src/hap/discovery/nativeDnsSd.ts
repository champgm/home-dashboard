import * as ServiceDiscovery from '@inthepocket/react-native-service-discovery';
import type { DnsSdAdapter, DiscoveryEvents, RawDnsSdService } from '../ports/contracts';

/** Android NSD/iOS Bonjour adapter. Only the HAP service type is exposed. */
export class NativeDnsSdAdapter implements DnsSdAdapter {
  private foundSubscription?: { remove(): void };
  private lostSubscription?: { remove(): void };

  async start(_serviceType: '_hap._tcp', events: DiscoveryEvents): Promise<void> {
    this.foundSubscription = ServiceDiscovery.addEventListener('serviceFound', (service) => {
      if (normalizeType(service.type) !== '_hap._tcp') return;
      events.found(toRaw(service));
    });
    this.lostSubscription = ServiceDiscovery.addEventListener('serviceLost', (service) => {
      if (normalizeType(service.type) !== '_hap._tcp') return;
      events.lost(toRaw(service));
    });
    await ServiceDiscovery.startSearch('hap');
  }

  async stop(_serviceType: '_hap._tcp'): Promise<void> {
    this.foundSubscription?.remove();
    this.lostSubscription?.remove();
    this.foundSubscription = undefined;
    this.lostSubscription = undefined;
    await ServiceDiscovery.stopSearch('hap');
  }
}

function normalizeType(type: string): string {
  return type.toLowerCase().replace(/\.$/, '');
}

function toRaw(service: {
  name: string;
  type: string;
  domain: string;
  hostName: string;
  addresses: string[];
  port: number;
  txt: Record<string, string>;
}): RawDnsSdService {
  return {
    name: service.name,
    type: '_hap._tcp',
    domain: service.domain,
    hostName: service.hostName,
    addresses: service.addresses,
    port: service.port,
    txt: service.txt
  };
}
