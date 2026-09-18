import type { CryptoProvider } from '../ports/contracts';
import { ReactNativeSrpAdapter } from './srp';
import { cryptoVectorManifest } from './vectorManifest';

export interface VectorRunResult {
  readonly provider: string;
  readonly passed: number;
  readonly failed: number;
  readonly failures: readonly string[];
}

export async function runCryptoVectorSuite(provider: CryptoProvider): Promise<VectorRunResult> {
  const failures: string[] = [];
  const check = async (name: string, operation: () => Promise<boolean>): Promise<void> => {
    try {
      if (!await operation()) failures.push(name);
    } catch {
      failures.push(name);
    }
  };
  await check('sha512-empty', async () => bytesToHex(await provider.sha512(new Uint8Array())) === 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
  await check('hmac-sha512-rfc4231', async () => bytesToHex(await provider.hmacSha512(new Uint8Array(20).fill(0x0b), new TextEncoder().encode('Hi There'))) === '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854');
  await check('hkdf-sha512', async () => {
    const output = await provider.hkdfSha512(new Uint8Array(32).fill(0), new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), 42);
    return output.length === 42;
  });
  await check('x25519-roundtrip', async () => {
    const first = await provider.x25519KeyPair(new Uint8Array(32).fill(1));
    const second = await provider.x25519KeyPair(new Uint8Array(32).fill(2));
    return bytesEqual(await provider.x25519(first.privateKey, second.publicKey), await provider.x25519(second.privateKey, first.publicKey));
  });
  await check('ed25519-roundtrip', async () => {
    const pair = await provider.ed25519KeyPair(new Uint8Array(32).fill(3));
    const message = new TextEncoder().encode('vector');
    const signature = await provider.ed25519Sign(message, pair.privateKey);
    return provider.ed25519Verify(signature, message, pair.publicKey);
  });
  await check('chacha20-poly1305-roundtrip', async () => {
    const message = new TextEncoder().encode('vector');
    const encrypted = await provider.aeadSeal(message, new Uint8Array(), new Uint8Array(12), new Uint8Array(32).fill(4));
    const opened = await provider.aeadOpen(encrypted, new Uint8Array(), new Uint8Array(12), new Uint8Array(32).fill(4));
    return new TextDecoder().decode(opened) === 'vector';
  });
  await check('srp-hap-transcript', async () => {
    const factory = new ReactNativeSrpAdapter();
    const client = factory.create(new Uint8Array(16).fill(1), new TextEncoder().encode('Pair-Setup'), new TextEncoder().encode('246-80-135'), await factory.randomPrivateKey());
    return client.computeA().length === 384;
  });
  const knownNames = new Set(cryptoVectorManifest.vectors.map((vector) => vector.name));
  return { provider: provider.name, passed: knownNames.size - failures.length, failed: failures.length, failures };
}

function bytesToHex(bytes: Uint8Array): string { return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
function bytesEqual(first: Uint8Array, second: Uint8Array): boolean { return first.length === second.length && first.every((byte, index) => byte === second[index]); }
