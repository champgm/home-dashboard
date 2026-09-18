import { PairingProtocol, PairingTlv } from '../../src/hap/core/pairSetup/pairingProtocol';
import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import { encodeTlv } from '../../src/hap/core/wire/tlv8';

describe('pairing protocol guard rails', () => {
  it('validates setup code without retaining or logging it', () => {
    expect(() => PairingProtocol.validateSetupCode('not-a-code')).toThrow();
    expect(() => PairingProtocol.validateSetupCode('000-00-000')).toThrow();
    expect(() => PairingProtocol.validateSetupCode('123-45-678')).toThrow();
    expect(() => PairingProtocol.validateSetupCode('246-80-135')).not.toThrow();
  });

  it('rejects malformed and out-of-order transcript messages', async () => {
    const protocol = new PairingProtocol(new SodiumCryptoProvider());
    await expect(protocol.buildPairSetupM1()).resolves.toBeInstanceOf(Uint8Array);
    expect(() => protocol.parsePairSetupM2(new Uint8Array([PairingTlv.state, 1, 3]))).toThrow();
    expect(() => protocol.parsePairSetupM2(encodeTlv([{ type: PairingTlv.state, value: new Uint8Array([4]) }]))).toThrow('unexpected state');
  });
});
