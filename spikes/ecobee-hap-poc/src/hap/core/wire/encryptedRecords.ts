import type { Bytes, CryptoProvider } from '../../ports/contracts';

export const HAP_RECORD_PLAINTEXT_LIMIT = 1024;
const HAP_TAG_BYTES = 16;
const HAP_NONCE_BYTES = 12;

function nonceFor(counter: number): Bytes {
  if (!Number.isSafeInteger(counter) || counter < 0) throw new Error('HAP record counter is invalid');
  const nonce = new Uint8Array(HAP_NONCE_BYTES);
  let value = counter;
  for (let index = 4; index < 12; index += 1) {
    nonce[index] = value % 256;
    value = Math.floor(value / 256);
  }
  return nonce;
}

export class EncryptedRecordEncoder {
  private counter = 0;

  constructor(private readonly crypto: CryptoProvider, private readonly key: Bytes) {}

  async encode(plaintext: Bytes): Promise<Bytes> {
    const records: Bytes[] = [];
    for (let offset = 0; offset < plaintext.length; offset += HAP_RECORD_PLAINTEXT_LIMIT) {
      const chunk = plaintext.subarray(offset, offset + HAP_RECORD_PLAINTEXT_LIMIT);
      const header = new Uint8Array([chunk.length & 0xff, (chunk.length >>> 8) & 0xff]);
      const cipher = await this.crypto.aeadSeal(chunk, header, nonceFor(this.counter), this.key);
      this.counter += 1;
      records.push(header, cipher);
    }
    return join(records);
  }
}

export class EncryptedRecordDecoder {
  private counter = 0;
  private buffer: Bytes = new Uint8Array() as Bytes;

  constructor(private readonly crypto: CryptoProvider, private readonly key: Bytes) {}

  async push(input: Bytes): Promise<Bytes[]> {
    this.buffer = join([this.buffer, input]);
    const plaintext: Bytes[] = [];
    while (this.buffer.length >= 2) {
      const length = this.buffer[0] | (this.buffer[1] << 8);
      if (length > HAP_RECORD_PLAINTEXT_LIMIT) throw new Error('encrypted record plaintext exceeds bound');
      const recordLength = 2 + length + HAP_TAG_BYTES;
      if (this.buffer.length < recordLength) break;
      const header = this.buffer.subarray(0, 2);
      const encrypted = this.buffer.subarray(2, recordLength);
      this.buffer = this.buffer.subarray(recordLength);
      const value = await this.crypto.aeadOpen(encrypted, header, nonceFor(this.counter), this.key);
      if (value.length !== length) throw new Error('encrypted record plaintext length mismatch');
      plaintext.push(value);
      this.counter += 1;
    }
    return plaintext;
  }

  finish(): void {
    if (this.buffer.length !== 0) throw new Error('truncated encrypted record');
  }
}

function join(parts: readonly Bytes[]): Bytes {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}
