import { decryptTpLink, encryptTpLink, utf8Decode } from "../../../../src/protocol/tplink/tplinkCipher";
import { decodeTpLinkFrame, encodeTpLinkFrame, TpLinkFrameDecoder } from "../../../../src/protocol/tplink/tplinkFrame";

describe("TP-Link legacy framing and XOR codec", () => {
  test("round trips UTF-8 payloads", () => {
    const encrypted = encryptTpLink("{\"system\":{\"get_sysinfo\":{}}}");
    expect(utf8Decode(decryptTpLink(encrypted))).toBe("{\"system\":{\"get_sysinfo\":{}}}");
  });

  test("frames and accepts fragmented input", () => {
    const payload = new Uint8Array([1, 2, 3]);
    const frame = encodeTpLinkFrame(payload);
    expect(Array.from(decodeTpLinkFrame(frame))).toEqual([1, 2, 3]);
    const decoder = new TpLinkFrameDecoder();
    expect(decoder.push(frame.slice(0, 2))).toHaveLength(0);
    expect(Array.from(decoder.push(frame.slice(2))[0])).toEqual([1, 2, 3]);
  });

  test("rejects truncated and oversized frames", () => {
    expect(() => decodeTpLinkFrame(new Uint8Array([0, 0, 0]))).toThrow();
    expect(() => encodeTpLinkFrame(new Uint8Array(64 * 1024 + 1))).toThrow();
  });
});
