import { err, ok, type Result } from '../../application/result';
import type { LocalNetworkSnapshot, NetworkEndpoint } from '../ports/contracts';

export type EndpointRejection = 'invalid-port' | 'ipv6-not-supported' | 'not-local' | 'inactive-interface' | 'invalid-address' | 'network-unavailable';

export function validateLocalEndpoint(
  host: string,
  port: number,
  interfaceId: string | undefined,
  network: LocalNetworkSnapshot
): Result<NetworkEndpoint, EndpointRejection> {
  if (!Number.isInteger(port) || port < 1 || port > 65535) return err('invalid-port');
  if (!network.available || network.activeInterfaceIds.length === 0 || network.ipv4Cidrs.length === 0) return err('network-unavailable');
  if (interfaceId !== undefined && !network.activeInterfaceIds.includes(interfaceId)) return err('inactive-interface');
  if (!isValidIpv4(host)) {
    if (host.includes(':')) return err('ipv6-not-supported');
    return err('invalid-address');
  }
  if (!isPrivateIpv4(host)) return err('not-local');
  const networkCidr = network.ipv4Cidrs.find((cidr) => containsCidr(cidr, host));
  if (!networkCidr) return err('not-local');
  return ok({ host, port, interfaceId: interfaceId ?? network.activeInterfaceIds[0], addressFamily: 'ipv4', networkCidr });
}

export function isValidIpv4(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

export function isPrivateIpv4(value: string): boolean {
  if (!isValidIpv4(value)) return false;
  const [first, second] = value.split('.').map(Number);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

export function containsCidr(cidr: string, address: string): boolean {
  const [network, prefixText] = cidr.split('/');
  const prefix = Number(prefixText);
  if (!isValidIpv4(network) || !isValidIpv4(address) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const networkValue = ipv4ToNumber(network);
  const addressValue = ipv4ToNumber(address);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (networkValue & mask) === (addressValue & mask);
}

function ipv4ToNumber(address: string): number {
  return address.split('.').map(Number).reduce((value, part) => ((value << 8) | part) >>> 0, 0);
}
