import type { Bytes } from '../../ports/contracts';

export const TLV_SEPARATOR = 0xff;

export interface TlvEntry {
  readonly type: number;
  readonly value: Bytes;
}

export interface TlvField {
  readonly type: number;
  readonly value: Bytes | readonly Bytes[];
}

export class TlvDecodeError extends Error {
  readonly category = 'malformed-tlv';
}

export function encodeTlv(fields: readonly TlvField[], maxBytes = 16_384): Bytes {
  const output: number[] = [];
  fields.forEach((field, fieldIndex) => {
    if (!Number.isInteger(field.type) || field.type < 0 || field.type > 255) throw new TlvDecodeError('TLV type is outside one byte');
    const values = Array.isArray(field.value) ? field.value : [field.value];
    values.forEach((value, valueIndex) => {
      if (valueIndex > 0) output.push(TLV_SEPARATOR, 0);
      const bytes = new Uint8Array(value);
      if (bytes.length === 0) output.push(field.type, 0);
      for (let offset = 0; offset < bytes.length; offset += 255) {
        const length = Math.min(255, bytes.length - offset);
        output.push(field.type, length, ...bytes.subarray(offset, offset + length));
      }
    });
    if (fieldIndex === fields.length - 1 && output.length > maxBytes) throw new TlvDecodeError('encoded TLV exceeds bound');
  });
  if (output.length > maxBytes) throw new TlvDecodeError('encoded TLV exceeds bound');
  return new Uint8Array(output);
}

export function decodeTlv(input: Bytes, maxBytes = 16_384): TlvEntry[] {
  if (input.length > maxBytes) throw new TlvDecodeError('TLV exceeds bound');
  const entries: TlvEntry[] = [];
  let offset = 0;
  while (offset < input.length) {
    if (offset + 2 > input.length) throw new TlvDecodeError('truncated TLV header');
    const type = input[offset];
    const length = input[offset + 1];
    offset += 2;
    if (offset + length > input.length) throw new TlvDecodeError('truncated TLV value');
    entries.push({ type, value: new Uint8Array(input.subarray(offset, offset + length)) });
    offset += length;
  }
  return entries;
}

export class TlvDocument {
  private constructor(readonly entries: readonly TlvEntry[]) {}

  static parse(input: Bytes, maxBytes?: number): TlvDocument {
    return new TlvDocument(decodeTlv(input, maxBytes));
  }

  get(type: number): Bytes | undefined {
    const values = this.values(type);
    return values[0];
  }

  values(type: number): Bytes[] {
    const values: Bytes[] = [];
    let current: Bytes | undefined;
    for (const entry of this.entries) {
      if (entry.type === TLV_SEPARATOR) {
        current = undefined;
        continue;
      }
      if (entry.type !== type) continue;
      if (current && this.entries[this.entries.indexOf(entry) - 1]?.type === type) {
        const joined = new Uint8Array(current.length + entry.value.length);
        joined.set(current, 0);
        joined.set(entry.value, current.length);
        current = joined;
        values[values.length - 1] = current;
      } else {
        current = new Uint8Array(entry.value);
        values.push(current);
      }
    }
    return values;
  }

  has(type: number): boolean {
    return this.entries.some((entry) => entry.type === type);
  }
}

export function concatBytes(...parts: readonly Bytes[]): Bytes {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}
