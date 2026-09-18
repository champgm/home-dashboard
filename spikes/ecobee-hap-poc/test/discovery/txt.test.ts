import { parseHapTxt } from '../../src/hap/discovery/txt';

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
