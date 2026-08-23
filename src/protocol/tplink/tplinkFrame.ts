export const MAX_TPLINK_PAYLOAD_BYTES = 64 * 1024;

export class TpLinkFrameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TpLinkFrameError";
  }
}

export function encodeTpLinkFrame(payload: Uint8Array): Uint8Array {
  if (payload.length > MAX_TPLINK_PAYLOAD_BYTES) {
    throw new TpLinkFrameError("TP-Link payload exceeds the 64 KiB limit.");
  }
  const frame = new Uint8Array(payload.length + 4);
  frame[0] = (payload.length >>> 24) & 0xff;
  frame[1] = (payload.length >>> 16) & 0xff;
  frame[2] = (payload.length >>> 8) & 0xff;
  frame[3] = payload.length & 0xff;
  frame.set(payload, 4);
  return frame;
}

export function declaredTpLinkPayloadLength(frame: Uint8Array): number {
  if (frame.length < 4) {
    throw new TpLinkFrameError("TP-Link frame is truncated before its length header.");
  }
  const length = ((frame[0] << 24) >>> 0) + (frame[1] << 16) + (frame[2] << 8) + frame[3];
  if (length > MAX_TPLINK_PAYLOAD_BYTES) {
    throw new TpLinkFrameError("TP-Link payload exceeds the 64 KiB limit.");
  }
  return length;
}

export function decodeTpLinkFrame(frame: Uint8Array): Uint8Array {
  const length = declaredTpLinkPayloadLength(frame);
  if (frame.length < length + 4) {
    throw new TpLinkFrameError("TP-Link frame is truncated.");
  }
  return frame.slice(4, 4 + length);
}

export class TpLinkFrameDecoder {
  private buffered = new Uint8Array(0);

  get hasBufferedData(): boolean {
    return this.buffered.length > 0;
  }

  push(chunk: Uint8Array): Uint8Array[] {
    const joined = new Uint8Array(this.buffered.length + chunk.length);
    joined.set(this.buffered);
    joined.set(chunk, this.buffered.length);
    this.buffered = joined;
    const frames: Uint8Array[] = [];
    while (this.buffered.length >= 4) {
      const length = declaredTpLinkPayloadLength(this.buffered);
      if (this.buffered.length < length + 4) break;
      frames.push(this.buffered.slice(4, length + 4));
      this.buffered = this.buffered.slice(length + 4);
    }
    return frames;
  }
}
