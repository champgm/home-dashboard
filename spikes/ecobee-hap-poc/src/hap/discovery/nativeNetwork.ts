import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import type { LocalNetworkSnapshot } from '../ports/contracts';

const UNAVAILABLE_NETWORK: LocalNetworkSnapshot = {
  available: false,
  activeInterfaceIds: [],
  ipv4Cidrs: []
};

/**
 * Converts the platform's Wi-Fi transport details into the narrow network policy
 * input used by discovery. NetInfo exposes the active transport kind (`wifi`)
 * rather than Android's OS interface name, so the logical ID is derived from
 * that live transport and the address/subnet are read from Android. The CIDR
 * remains the authoritative unrelated-interface guard for this native adapter.
 */
export function localNetworkFromNetInfo(state: NetInfoState): LocalNetworkSnapshot {
  if (state.type !== 'wifi' || state.isConnected !== true) return UNAVAILABLE_NETWORK;
  const ipAddress = state.details.ipAddress;
  const subnet = state.details.subnet;
  const networkCidr = ipAddress && subnet ? cidrForAddress(ipAddress, subnet) : undefined;
  if (!networkCidr) return UNAVAILABLE_NETWORK;
  return {
    available: true,
    activeInterfaceIds: [state.type],
    ipv4Cidrs: [networkCidr]
  };
}

/** Live Wi-Fi snapshot with a fail-closed listener for transport changes. */
export class NativeWifiNetworkSnapshot {
  private current: LocalNetworkSnapshot = UNAVAILABLE_NETWORK;
  private readonly listeners = new Set<() => void>();
  private readonly removeListener: (() => void) | undefined;

  constructor() {
    try {
      this.removeListener = NetInfo.addEventListener((state) => {
        this.update(localNetworkFromNetInfo(state));
      });
    } catch {
      this.removeListener = undefined;
    }
  }

  snapshot = (): LocalNetworkSnapshot => this.current;

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async refresh(): Promise<void> {
    try {
      this.update(localNetworkFromNetInfo(await NetInfo.refresh()));
    } catch {
      this.update(UNAVAILABLE_NETWORK);
    }
  }

  close(): void {
    this.removeListener?.();
    this.listeners.clear();
    this.current = UNAVAILABLE_NETWORK;
  }

  private update(snapshot: LocalNetworkSnapshot): void {
    this.current = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

export function cidrForAddress(address: string, subnet: string): string | undefined {
  const addressParts = parseIpv4(address);
  const prefix = prefixForSubnet(subnet);
  if (!addressParts || prefix === undefined) return undefined;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const addressValue = addressParts.reduce((value, part) => ((value << 8) | part) >>> 0, 0);
  const networkValue = addressValue & mask;
  return `${[(networkValue >>> 24) & 255, (networkValue >>> 16) & 255, (networkValue >>> 8) & 255, networkValue & 255].join('.')}/${prefix}`;
}

function prefixForSubnet(subnet: string): number | undefined {
  if (/^\d{1,2}$/.test(subnet)) {
    const prefix = Number(subnet);
    return prefix >= 0 && prefix <= 32 ? prefix : undefined;
  }
  if (subnet.includes('/')) {
    const prefix = Number(subnet.split('/')[1]);
    return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32 ? prefix : undefined;
  }
  const parts = parseIpv4(subnet);
  if (!parts) return undefined;
  const mask = parts.reduce((value, part) => ((value << 8) | part) >>> 0, 0);
  let prefix = 0;
  let bit = 0x80000000;
  while ((mask & bit) !== 0) {
    prefix += 1;
    bit >>>= 1;
  }
  const expectedMask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return mask === expectedMask ? prefix : undefined;
}

function parseIpv4(value: string): number[] | undefined {
  const parts = value.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return undefined;
  return parts.map(Number);
}
