import { EncryptedRecordDecoder, EncryptedRecordEncoder } from '../../src/hap/core/wire/encryptedRecords';
import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';

describe('HAP encrypted record framing', () => {
  it('round-trips fragmented/coalesced records with 1024-byte splitting', async () => {
    const provider = new SodiumCryptoProvider();
    const key = new Uint8Array(32).fill(8);
    const input = new Uint8Array(2_100).map((_, index) => index & 255);
    const encoded = await new EncryptedRecordEncoder(provider, key).encode(input);
    const decoder = new EncryptedRecordDecoder(provider, key);
    const output: Uint8Array[] = [];
    for (let index = 0; index < encoded.length; index += 17) output.push(...await decoder.push(encoded.subarray(index, index + 17)));
    const joined = new Uint8Array(output.reduce((total, part) => total + part.length, 0));
    let offset = 0;
    output.forEach((part) => { joined.set(part, offset); offset += part.length; });
    expect([...joined]).toEqual([...input]);
    decoder.finish();
  });

  it('fails closed for altered authentication and truncated records', async () => {
    const provider = new SodiumCryptoProvider();
    const key = new Uint8Array(32).fill(9);
    const encoded = await new EncryptedRecordEncoder(provider, key).encode(new TextEncoder().encode('secretless')); 
    encoded[encoded.length - 1] ^= 1;
    await expect(new EncryptedRecordDecoder(provider, key).push(encoded)).rejects.toThrow();
    const decoder = new EncryptedRecordDecoder(provider, key);
    await decoder.push(new Uint8Array([10, 0]));
    expect(() => decoder.finish()).toThrow('truncated');
  });
});
