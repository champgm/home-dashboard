import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import { FastSrpHapAdapter } from '../../src/hap/crypto/srp';

const hex = (value: string): Uint8Array => new Uint8Array(value.match(/../g)!.map((part) => Number.parseInt(part, 16)));
const toHex = (value: Uint8Array): string => [...value].map((byte) => byte.toString(16).padStart(2, '0')).join('');

describe('qualified HAP crypto provider', () => {
  const provider = new SodiumCryptoProvider();

  it('matches SHA-512 and HMAC-SHA-512 known answers', async () => {
    expect(toHex(await provider.sha512(new Uint8Array()))).toBe(
      'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
    );
    const hmac = await provider.hmacSha512(new Uint8Array(20).fill(0x0b), new TextEncoder().encode('Hi There'));
    expect(toHex(hmac)).toBe(
      '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854'
    );
  });

  it('round-trips the exact HAP asymmetric and AEAD operations', async () => {
    const first = await provider.x25519KeyPair(hex('0101010101010101010101010101010101010101010101010101010101010101'));
    const second = await provider.x25519KeyPair(hex('0202020202020202020202020202020202020202020202020202020202020202'));
    expect(toHex(await provider.x25519(first.privateKey, second.publicKey))).toBe(
      toHex(await provider.x25519(second.privateKey, first.publicKey))
    );
    const ed = await provider.ed25519KeyPair(hex('0303030303030303030303030303030303030303030303030303030303030303'));
    const message = new TextEncoder().encode('hap-vector');
    const signature = await provider.ed25519Sign(message, ed.privateKey);
    expect(await provider.ed25519Verify(signature, message, ed.publicKey)).toBe(true);
    expect(await provider.ed25519Verify(signature, new TextEncoder().encode('changed'), ed.publicKey)).toBe(false);
    const encrypted = await provider.aeadSeal(message, new Uint8Array([1, 2]), new Uint8Array(12), new Uint8Array(32).fill(4));
    expect(new TextDecoder().decode(await provider.aeadOpen(encrypted, new Uint8Array([1, 2]), new Uint8Array(12), new Uint8Array(32).fill(4)))).toBe('hap-vector');
    encrypted[encrypted.length - 1] ^= 1;
    await expect(provider.aeadOpen(encrypted, new Uint8Array([1, 2]), new Uint8Array(12), new Uint8Array(32).fill(4))).rejects.toThrow();
  });

  it('retains SRP behind a narrow adapter', async () => {
    const adapter = new FastSrpHapAdapter();
    const privateKey = await adapter.randomPrivateKey();
    const client = adapter.create(new Uint8Array(16).fill(1), new TextEncoder().encode('Pair-Setup'), new TextEncoder().encode('111-22-333'), privateKey);
    expect(client.computeA()).toHaveLength(384);
  });
});
