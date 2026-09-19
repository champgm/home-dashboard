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
    const diagnosticBridge = diagnosticBridgeFromEnvironment();
    if (diagnosticBridge) events.found(diagnosticBridge);
  }

  async stop(_serviceType: '_hap._tcp'): Promise<void> {
    this.foundSubscription?.remove();
    this.lostSubscription?.remove();
    this.foundSubscription = undefined;
    this.lostSubscription = undefined;
    await ServiceDiscovery.stopSearch('hap');
  }
}

/** Build-time diagnostic hook. Normal builds omit all three variables and expose no synthetic target. */
const EMBEDDED_DIAGNOSTIC_ENVIRONMENT = {
  EXPO_PUBLIC_HAP_BRIDGE_HOST: process.env.EXPO_PUBLIC_HAP_BRIDGE_HOST,
  EXPO_PUBLIC_HAP_BRIDGE_PORT: process.env.EXPO_PUBLIC_HAP_BRIDGE_PORT,
  EXPO_PUBLIC_HAP_BRIDGE_ID: process.env.EXPO_PUBLIC_HAP_BRIDGE_ID
};

export function diagnosticBridgeFromEnvironment(environment: Readonly<Record<string, string | undefined>> = EMBEDDED_DIAGNOSTIC_ENVIRONMENT): RawDnsSdService | undefined {
  const host = environment.EXPO_PUBLIC_HAP_BRIDGE_HOST;
  const portText = environment.EXPO_PUBLIC_HAP_BRIDGE_PORT;
  const identity = environment.EXPO_PUBLIC_HAP_BRIDGE_ID;
  const port = Number(portText);
  if (!host || !identity || !Number.isInteger(port) || port < 1 || port > 65535) return undefined;
  return {
    name: 'Emulator diagnostic bridge',
    type: '_hap._tcp',
    domain: 'local',
    hostName: 'emulator-diagnostic-bridge.local',
    addresses: [host],
    port,
    txt: { 'c#': '1', ff: '0', id: identity, md: 'Diagnostic bridge', pv: '1.1', 's#': '1', sf: '1', ci: '9' }
  };
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
