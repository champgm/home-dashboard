import { DEFAULT_TPLINK_PORT } from './endpointValidation';

export interface BundledPlugEndpoint {
  readonly id: string;
  readonly ipv4: string;
  readonly port: number;
}

/*
 * Deployment-specific addresses are intentionally not guessed. The array is a
 * bundled, replaceable data boundary: a household build can add its known
 * static endpoints, while a clean checkout starts without phantom devices.
 */
export const BUNDLED_PLUG_PRESEED: readonly BundledPlugEndpoint[] = [
  {
    id: 'TP-Link-Macs-Desk',
    ipv4: '192.168.2.219',
    port: 9999,
  },  
  {
    id: 'TP-LINK-Plug-2',
    ipv4: '192.168.2.210',
    port: 9999,
  },  
  {
    id: 'TP-LINK-Plug-3',
    ipv4: '192.168.2.211',
    port: 9999,
  },  
  {
    id: 'TP-LINK-Plug-With-Monitor-1',
    ipv4: '192.168.2.218',
    port: 9999,
  },  
  {
    id: 'TP-LINK-Plug-With-Monitor-2',
    ipv4: '192.168.2.226',
    port: 9999,
  },  
  {
    id: 'TP-Link-Small-1',
    ipv4: '192.168.2.220',
    port: 9999,
  },  
  {
    id: 'TP-Link-Small-2',
    ipv4: '192.168.2.221',
    port: 9999,
  },  
  {
    id: 'TP-Link-Small-3',
    ipv4: '192.168.2.225',
    port: 9999,
  },  
  {
    id: 'TP-Link-Small-Outside',
    ipv4: '192.168.2.223',
    port: 9999,
  },  
  {
    id: 'TPLink-TV-Peripherals',
    ipv4: '192.168.2.214',
    port: 9999,
  }
];

export function getBundledPlugPreseed(
  source: readonly BundledPlugEndpoint[] = BUNDLED_PLUG_PRESEED,
): BundledPlugEndpoint[] {
  return source.map((endpoint) => ({
    id: endpoint.id,
    ipv4: endpoint.ipv4,
    port: endpoint.port || DEFAULT_TPLINK_PORT,
  }));
}
