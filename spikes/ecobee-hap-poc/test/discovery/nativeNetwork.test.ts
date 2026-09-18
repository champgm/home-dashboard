import type { NetInfoState } from '@react-native-community/netinfo';
import { cidrForAddress, localNetworkFromNetInfo } from '../../src/hap/discovery/nativeNetwork';

describe('native Wi-Fi network snapshot', () => {
  it('derives the active IPv4 CIDR from platform Wi-Fi details', () => {
    const state = {
      type: 'wifi',
      isConnected: true,
      isInternetReachable: false,
      details: {
        isConnectionExpensive: false,
        ssid: null,
        bssid: null,
        strength: null,
        ipAddress: '192.168.50.27',
        subnet: '255.255.255.0',
        frequency: null,
        linkSpeed: null,
        rxLinkSpeed: null,
        txLinkSpeed: null
      }
    } as NetInfoState;
    expect(localNetworkFromNetInfo(state)).toEqual({ available: true, activeInterfaceIds: ['wifi'], ipv4Cidrs: ['192.168.50.0/24'] });
  });

  it('fails closed for missing or malformed platform details', () => {
    const unavailable = localNetworkFromNetInfo({ type: 'none', isConnected: false, isInternetReachable: false, details: null } as NetInfoState);
    expect(unavailable).toEqual({ available: false, activeInterfaceIds: [], ipv4Cidrs: [] });
    expect(cidrForAddress('192.168.50.27', '255.0.255.0')).toBeUndefined();
    expect(cidrForAddress('192.168.50.27', '24')).toBe('192.168.50.0/24');
  });
});
