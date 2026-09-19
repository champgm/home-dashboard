import { parseHapTxt } from '../../src/hap/discovery/txt';
import { diagnosticBridgeFromEnvironment } from '../../src/hap/discovery/nativeDnsSd';

describe('HAP DNS-SD TXT parsing', () => {
  it('parses only the required advertised fields', () => {
    const result = parseHapTxt({
      type: '_hap._tcp.',
      txt: { 'c#': '4', ff: '2', id: 'AA:BB:CC:DD:EE:FF', md: 'Thermostat', pv: '1.1', 's#': '1', sf: '1', ci: '9' }
    });
    expect(result).toEqual({ configurationNumber: 4, featureFlags: 2, accessoryId: 'AA:BB:CC:DD:EE:FF', model: 'Thermostat', protocolVersion: '1.1', stateNumber: 1, category: 9, pairingAvailable: true });
  });

  it('rejects malformed or unrelated records', () => {
    expect(() => parseHapTxt({ type: '_http._tcp', txt: {} })).toThrow();
    expect(() => parseHapTxt({ type: '_hap._tcp', txt: { 'c#': 'x', 's#': '1', id: 'id', pv: '1.1' } })).toThrow();
    expect(() => parseHapTxt({ type: '_hap._tcp', txt: { 'c#': '1', 's#': '1', id: 'id', pv: '1.1', ci: 'not-a-category' } })).toThrow();
  });

  it('preserves a missing category for the discovery coordinator to reject', () => {
    expect(parseHapTxt({ type: '_hap._tcp', txt: { 'c#': '1', 's#': '1', id: 'missing-category-id', pv: '1.1' } }).category).toBeUndefined();
  });
});

describe('emulator diagnostic bridge', () => {
  it('is absent unless every build-time value is explicit', () => {
    expect(diagnosticBridgeFromEnvironment({})).toBeUndefined();
    expect(diagnosticBridgeFromEnvironment({ EXPO_PUBLIC_HAP_BRIDGE_HOST: '10.0.2.2' })).toBeUndefined();
  });

  it('creates a HAP thermostat record without embedding a default household endpoint', () => {
    const service = diagnosticBridgeFromEnvironment({
      EXPO_PUBLIC_HAP_BRIDGE_HOST: '10.0.2.2',
      EXPO_PUBLIC_HAP_BRIDGE_PORT: '54321',
      EXPO_PUBLIC_HAP_BRIDGE_ID: 'diagnostic-id'
    });
    expect(service).toMatchObject({ addresses: ['10.0.2.2'], port: 54321, txt: { id: 'diagnostic-id', sf: '1', ci: '9' } });
  });
});
