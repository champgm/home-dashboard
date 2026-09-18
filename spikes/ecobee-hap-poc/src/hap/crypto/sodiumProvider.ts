import sodium from 'libsodium-wrappers';
import type { Bytes, CryptoKeyPair, CryptoProvider } from '../ports/contracts';

function copy(value: Uint8Array): Bytes {
  return new Uint8Array(value) as Bytes;
}

function requireLength(name: string, value: Bytes, length: number): void {
  if (value.byteLength !== length) throw new Error(`${name} must be ${length} bytes`);
}

/**
 * The POC's exact primitive provider.
 *
 * libsodium is retained as an independently versioned provider rather than
 * reimplementing a primitive in this repository. SRP remains in the reviewed
 * fast-srp-hap adapter because it is not a Sodium primitive.
 */
export class SodiumCryptoProvider implements CryptoProvider {
  readonly name = 'libsodium-wrappers@0.7.15';

  async ready(): Promise<void> {
    await sodium.ready;
  }

  async randomBytes(length: number): Promise<Bytes> {
    if (!Number.isInteger(length) || length <= 0 || length > 65536) {
      throw new Error('random byte length is outside the approved bound');
    }
    await this.ready();
    return copy(sodium.randombytes_buf(length));
  }

  async sha512(input: Bytes): Promise<Bytes> {
    await this.ready();
    return copy(sodium.crypto_hash(input));
  }

  async hmacSha512(key: Bytes, input: Bytes): Promise<Bytes> {
    if (key.byteLength === 0) throw new Error('HMAC key must not be empty');
    await this.ready();
    const block = 128;
    const normalizedKey = key.byteLength > block ? await this.sha512(key) : key;
    const innerPad = new Uint8Array(block).fill(0x36);
    const outerPad = new Uint8Array(block).fill(0x5c);
    for (let index = 0; index < normalizedKey.byteLength; index += 1) {
      innerPad[index] ^= normalizedKey[index];
      outerPad[index] ^= normalizedKey[index];
    }
    const innerInput = new Uint8Array(innerPad.byteLength + input.byteLength);
    innerInput.set(innerPad, 0);
    innerInput.set(input, innerPad.byteLength);
    const inner = await this.sha512(innerInput);
    const outerInput = new Uint8Array(outerPad.byteLength + inner.byteLength);
    outerInput.set(outerPad, 0);
    outerInput.set(inner, outerPad.byteLength);
    return this.sha512(outerInput);
  }

  async hkdfSha512(salt: Bytes, info: Bytes, input: Bytes, length: number): Promise<Bytes> {
    if (!Number.isInteger(length) || length < 0 || length > 255 * 64) {
      throw new Error('HKDF output length is outside the approved bound');
    }
    if (length === 0) return new Uint8Array();
    const prk = await this.hmacSha512(salt.byteLength ? salt : new Uint8Array(64), input);
    const output = new Uint8Array(length);
    let previous: Bytes = new Uint8Array() as Bytes;
    let offset = 0;
    for (let counter = 1; offset < length; counter += 1) {
      const blockInput = new Uint8Array(previous.byteLength + info.byteLength + 1);
      blockInput.set(previous, 0);
      blockInput.set(info, previous.byteLength);
      blockInput[blockInput.length - 1] = counter;
      previous = await this.hmacSha512(prk, blockInput);
      const take = Math.min(previous.byteLength, length - offset);
      output.set(previous.subarray(0, take), offset);
      offset += take;
    }
    return output;
  }

  async x25519KeyPair(privateKey?: Bytes): Promise<CryptoKeyPair> {
    await this.ready();
    const secret = privateKey ? copy(privateKey) : copy(sodium.randombytes_buf(32));
    requireLength('X25519 private key', secret, 32);
    return { privateKey: secret, publicKey: copy(sodium.crypto_scalarmult_base(secret)) };
  }

  async x25519(privateKey: Bytes, publicKey: Bytes): Promise<Bytes> {
    requireLength('X25519 private key', privateKey, 32);
    requireLength('X25519 public key', publicKey, 32);
    await this.ready();
    return copy(sodium.crypto_scalarmult(privateKey, publicKey));
  }

  async ed25519KeyPair(seed?: Bytes): Promise<CryptoKeyPair> {
    await this.ready();
    const input = seed ? copy(seed) : copy(sodium.randombytes_buf(32));
    requireLength('Ed25519 seed', input, 32);
    const pair = sodium.crypto_sign_seed_keypair(input);
    return { privateKey: copy(pair.privateKey), publicKey: copy(pair.publicKey) };
  }

  async ed25519Sign(message: Bytes, privateKey: Bytes): Promise<Bytes> {
    requireLength('Ed25519 private key', privateKey, sodium.crypto_sign_SECRETKEYBYTES);
    await this.ready();
    return copy(sodium.crypto_sign_detached(message, privateKey));
  }

  async ed25519Verify(signature: Bytes, message: Bytes, publicKey: Bytes): Promise<boolean> {
    await this.ready();
    requireLength('Ed25519 signature', signature, sodium.crypto_sign_BYTES);
    requireLength('Ed25519 public key', publicKey, sodium.crypto_sign_PUBLICKEYBYTES);
    return sodium.crypto_sign_verify_detached(signature, message, publicKey);
  }

  async aeadSeal(plaintext: Bytes, aad: Bytes, nonce: Bytes, key: Bytes): Promise<Bytes> {
    await this.ready();
    requireLength('ChaCha20-Poly1305 key', key, sodium.crypto_aead_chacha20poly1305_ietf_KEYBYTES);
    requireLength('ChaCha20-Poly1305 nonce', nonce, sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);
    return copy(sodium.crypto_aead_chacha20poly1305_ietf_encrypt(plaintext, aad, null, nonce, key));
  }

  async aeadOpen(ciphertextAndTag: Bytes, aad: Bytes, nonce: Bytes, key: Bytes): Promise<Bytes> {
    await this.ready();
    requireLength('ChaCha20-Poly1305 key', key, sodium.crypto_aead_chacha20poly1305_ietf_KEYBYTES);
    requireLength('ChaCha20-Poly1305 nonce', nonce, sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);
    if (ciphertextAndTag.byteLength < sodium.crypto_aead_chacha20poly1305_ietf_ABYTES) {
      throw new Error('ChaCha20-Poly1305 record is shorter than its tag');
    }
    return copy(sodium.crypto_aead_chacha20poly1305_ietf_decrypt(null, ciphertextAndTag, aad, nonce, key));
  }
}

export const sodiumCrypto = new SodiumCryptoProvider();
