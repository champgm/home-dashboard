import { decodeTlv, encodeTlv, TlvDocument, TLV_SEPARATOR } from '../../src/hap/core/wire/tlv8';

describe('HAP TLV8', () => {
  it('splits long values, preserves repeated values, and keeps separators', () => {
    const long = new Uint8Array(300).fill(7);
    const encoded = encodeTlv([{ type: 1, value: [new Uint8Array([1, 2]), new Uint8Array([3]) ] }, { type: 2, value: long }]);
    expect(encoded.includes(TLV_SEPARATOR)).toBe(true);
    expect(TlvDocument.parse(encoded).values(1).map((value) => [...value])).toEqual([[1, 2], [3]]);
    expect(TlvDocument.parse(encoded).get(2)).toHaveLength(300);
  });

  it('rejects truncated and oversize data', () => {
    expect(() => decodeTlv(new Uint8Array([1]))).toThrow('truncated TLV header');
    expect(() => decodeTlv(new Uint8Array([1, 3, 1]))).toThrow('truncated TLV value');
    expect(() => decodeTlv(new Uint8Array(20), 10)).toThrow('exceeds bound');
  });
});
