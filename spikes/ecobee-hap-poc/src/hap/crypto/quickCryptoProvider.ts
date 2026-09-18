import QuickCrypto, { Buffer } from 'react-native-quick-crypto';
import type { Bytes, CryptoKeyPair, CryptoProvider } from '../ports/contracts';

function copy(value: Uint8Array): Bytes {
  return new Uint8Array(value);
}

function buffer(value: Bytes): Buffer {
  return Buffer.from(value);
}

function concatenate(first: Bytes, second: Bytes): Bytes {
  const output = new Uint8Array(first.byteLength + second.byteLength);
  output.set(first, 0);
  output.set(second, first.byteLength);
  return output;
}

function requireLength(name: string, value: Bytes, length: number): void {
  if (value.byteLength !== length) throw new Error(`${name} must be ${length} bytes`);
}

/**
 * React Native primitive provider for the Android qualification build.
 *
 * The desktop/Jest provider remains libsodium-wrappers so the deterministic
 * protocol tests do not depend on a native module. The Android app must use
 * this provider because Hermes does not expose WebAssembly. All native calls
 * stay behind the same CryptoProvider contract used by the HAP services.
 */
export class ReactNativeCryptoProvider implements CryptoProvider {
  readonly name = 'react-native-quick-crypto@1.1.7';

  async ready(): Promise<void> {
    // This is deliberately a native capability probe. If the Nitro module is
    // unavailable, qualification records a failed vector instead of silently
    // falling back to a JavaScript/WebAssembly implementation.
    QuickCrypto.getHashes();
  }

  async randomBytes(length: number): Promise<Bytes> {
    if (!Number.isInteger(length) || length <= 0 || length > 65536) {
      throw new Error('random byte length is outside the approved bound');
    }
    await this.ready();
    return copy(QuickCrypto.randomBytes(length));
  }

  async sha512(input: Bytes): Promise<Bytes> {
    await this.ready();
    return copy(QuickCrypto.createHash('sha512').update(buffer(input)).digest());
  }

  async hmacSha512(key: Bytes, input: Bytes): Promise<Bytes> {
    if (key.byteLength === 0) throw new Error('HMAC key must not be empty');
    await this.ready();
    return copy(QuickCrypto.createHmac('sha512', buffer(key)).update(buffer(input)).digest());
  }

  async hkdfSha512(salt: Bytes, info: Bytes, input: Bytes, length: number): Promise<Bytes> {
    if (!Number.isInteger(length) || length < 0 || length > 255 * 64) {
      throw new Error('HKDF output length is outside the approved bound');
    }
    if (length === 0) return new Uint8Array();
    await this.ready();
    return copy(QuickCrypto.hkdfSync('sha512', buffer(input), buffer(salt), buffer(info), length));
  }

  async x25519KeyPair(privateKey?: Bytes): Promise<CryptoKeyPair> {
    await this.ready();
    const secret = privateKey ? copy(privateKey) : copy(QuickCrypto.randomBytes(32));
    requireLength('X25519 private key', secret, 32);
    const privateObject = QuickCrypto.createPrivateKey({
      key: buffer(secret),
      format: 'raw-private',
      asymmetricKeyType: 'x25519'
    });
    const publicObject = QuickCrypto.createPublicKey(privateObject);
    return { privateKey: secret, publicKey: copy(publicObject.export({ format: 'raw-public' })) };
  }

  async x25519(privateKey: Bytes, publicKey: Bytes): Promise<Bytes> {
    requireLength('X25519 private key', privateKey, 32);
    requireLength('X25519 public key', publicKey, 32);
    await this.ready();
    const privateObject = QuickCrypto.createPrivateKey({
      key: buffer(privateKey),
      format: 'raw-private',
      asymmetricKeyType: 'x25519'
    });
    const publicObject = QuickCrypto.createPublicKey({
      key: buffer(publicKey),
      format: 'raw-public',
      asymmetricKeyType: 'x25519'
    });
    const shared = QuickCrypto.diffieHellman({ privateKey: privateObject, publicKey: publicObject });
    if (!shared) throw new Error('X25519 provider returned no shared secret');
    return copy(shared);
  }

  async ed25519KeyPair(seed?: Bytes): Promise<CryptoKeyPair> {
    await this.ready();
    const input = seed ? copy(seed) : copy(QuickCrypto.randomBytes(32));
    requireLength('Ed25519 seed', input, 32);
    const privateObject = QuickCrypto.createPrivateKey({
      key: buffer(input),
      // Android's OpenSSL build rejects raw-seed imports for Ed25519 even
      // though its raw-private import accepts the 32-byte seed layout.
      format: 'raw-private',
      asymmetricKeyType: 'ed25519'
    });
    const publicObject = QuickCrypto.createPublicKey(privateObject);
    const publicKey = copy(publicObject.export({ format: 'raw-public' }));
    // libsodium's CryptoProvider contract exposes the 64-byte secret-key
    // layout (seed || public key), so retain that shape for HAP callers.
    return { privateKey: concatenate(input, publicKey), publicKey };
  }

  async ed25519Sign(message: Bytes, privateKey: Bytes): Promise<Bytes> {
    requireLength('Ed25519 private key', privateKey, 64);
    await this.ready();
    const privateObject = QuickCrypto.createPrivateKey({
      key: buffer(privateKey.subarray(0, 32)),
      format: 'raw-private',
      asymmetricKeyType: 'ed25519'
    });
    return copy(QuickCrypto.sign(null, buffer(message), privateObject));
  }

  async ed25519Verify(signature: Bytes, message: Bytes, publicKey: Bytes): Promise<boolean> {
    requireLength('Ed25519 signature', signature, 64);
    requireLength('Ed25519 public key', publicKey, 32);
    await this.ready();
    const publicObject = QuickCrypto.createPublicKey({
      key: buffer(publicKey),
      format: 'raw-public',
      asymmetricKeyType: 'ed25519'
    });
    return QuickCrypto.verify(null, buffer(message), publicObject, buffer(signature));
  }

  async aeadSeal(plaintext: Bytes, aad: Bytes, nonce: Bytes, key: Bytes): Promise<Bytes> {
    requireLength('ChaCha20-Poly1305 key', key, 32);
    requireLength('ChaCha20-Poly1305 nonce', nonce, 12);
    await this.ready();
    const cipher = QuickCrypto.createCipheriv('chacha20-poly1305', buffer(key), buffer(nonce), { authTagLength: 16 });
    cipher.setAAD(buffer(aad), { plaintextLength: plaintext.byteLength });
    const ciphertext = Buffer.concat([cipher.update(buffer(plaintext)), cipher.final()]);
    return copy(Buffer.concat([ciphertext, cipher.getAuthTag()]));
  }

  async aeadOpen(ciphertextAndTag: Bytes, aad: Bytes, nonce: Bytes, key: Bytes): Promise<Bytes> {
    requireLength('ChaCha20-Poly1305 key', key, 32);
    requireLength('ChaCha20-Poly1305 nonce', nonce, 12);
    if (ciphertextAndTag.byteLength < 16) throw new Error('ChaCha20-Poly1305 record is shorter than its tag');
    await this.ready();
    const ciphertext = ciphertextAndTag.subarray(0, ciphertextAndTag.byteLength - 16);
    const tag = ciphertextAndTag.subarray(ciphertextAndTag.byteLength - 16);
    const decipher = QuickCrypto.createDecipheriv('chacha20-poly1305', buffer(key), buffer(nonce), { authTagLength: 16 });
    decipher.setAAD(buffer(aad), { plaintextLength: ciphertext.byteLength });
    decipher.setAuthTag(buffer(tag));
    return copy(Buffer.concat([decipher.update(buffer(ciphertext)), decipher.final()]));
  }
}

export const reactNativeCrypto = new ReactNativeCryptoProvider();
