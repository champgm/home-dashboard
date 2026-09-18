import { containsCidr, isPrivateIpv4, validateLocalEndpoint } from '../../src/hap/discovery/endpointPolicy';

describe('local HAP endpoint policy', () => {
  const network = { available: true, activeInterfaceIds: ['wifi0'], ipv4Cidrs: ['192.168.50.0/24'] };

  it('accepts only a validated local endpoint on the active interface', () => {
    expect(validateLocalEndpoint('192.168.50.40', 12345, 'wifi0', network).ok).toBe(true);
    expect(validateLocalEndpoint('192.168.51.40', 12345, 'wifi0', network)).toEqual({ ok: false, error: 'not-local' });
  });

  it.each(['127.0.0.1', '0.0.0.0', '8.8.8.8', '169.254.1.1'])('rejects unsafe endpoint %s', (host) => {
    expect(validateLocalEndpoint(host, 12345, 'wifi0', { ...network, ipv4Cidrs: [] }).ok).toBe(false);
  });

  it('keeps IPv6 observed but unsupported in the first POC', () => {
    expect(validateLocalEndpoint('fe80::1', 12345, 'wifi0', network)).toEqual({ ok: false, error: 'ipv6-not-supported' });
    expect(validateLocalEndpoint('192.168.50.40', 0, 'wifi0', network)).toEqual({ ok: false, error: 'invalid-port' });
  });

  it('fails closed when active Wi-Fi data is unavailable', () => {
    expect(validateLocalEndpoint('192.168.50.40', 12345, undefined, { available: false, activeInterfaceIds: [], ipv4Cidrs: [] })).toEqual({ ok: false, error: 'network-unavailable' });
  });

  it('has deterministic private-address and CIDR checks', () => {
    expect(isPrivateIpv4('10.0.0.4')).toBe(true);
    expect(isPrivateIpv4('172.31.1.4')).toBe(true);
    expect(isPrivateIpv4('172.32.1.4')).toBe(false);
    expect(containsCidr('192.168.1.0/24', '192.168.1.7')).toBe(true);
  });
});
