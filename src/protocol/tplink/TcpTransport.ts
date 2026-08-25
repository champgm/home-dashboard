import { validatePlugEndpoint } from "../../config/endpointValidation";
import { PlugEndpoint } from "../../app/types";
import { TpLinkFrameDecoder } from "./tplinkFrame";

export class TcpTransportError extends Error {
  readonly category: "NetworkUnavailable" | "Timeout" | "ProtocolMalformed" | "Ambiguous";
  readonly possibleSend: boolean;

  constructor(category: "NetworkUnavailable" | "Timeout" | "ProtocolMalformed" | "Ambiguous", message: string, possibleSend: boolean) {
    super(message);
    this.name = "TcpTransportError";
    this.category = category;
    this.possibleSend = possibleSend;
  }
}

export interface TcpTransport {
  send(endpoint: PlugEndpoint, frame: Uint8Array, timeoutMs: number, writeMayTransmit: boolean): Promise<Uint8Array>;
}

export interface TcpSocketLike {
  on(event: "data" | "error" | "close", listener: (...args: any[]) => void): void;
  connect(options: { host: string; port: number; connectTimeout?: number }, callback?: () => void): void;
  write(data: Uint8Array | string): void;
  destroy(): void;
}

export type TcpSocketFactory = (endpoint: PlugEndpoint, callbacks: {
  onConnected(): void;
  onData(data: Uint8Array): void;
  onError(error: unknown): void;
  onClose(): void;
}, connectTimeoutMs: number) => TcpSocketLike;

export const DEFAULT_NATIVE_CONNECT_TIMEOUT_MS = 1000;

function defaultSocketFactory(endpoint: PlugEndpoint, callbacks: {
  onConnected(): void;
  onData(data: Uint8Array): void;
  onError(error: unknown): void;
  onClose(): void;
}, connectTimeoutMs: number): TcpSocketLike {
  // The require is kept inside the platform transport boundary so tests can
  // replace it with a deterministic fake and UI code never receives a socket.
  const tcpSocket = require("react-native-tcp-socket") as { createConnection(options: object, callback?: () => void): TcpSocketLike };
  const socket = tcpSocket.createConnection({
    host: endpoint.ipv4,
    port: endpoint.port,
    connectTimeout: connectTimeoutMs,
  }, callbacks.onConnected);
  socket.on("data", callbacks.onData);
  socket.on("error", callbacks.onError);
  socket.on("close", callbacks.onClose);
  return socket;
}

export class ReactNativeTcpTransport implements TcpTransport {
  private readonly socketFactory: TcpSocketFactory;
  private readonly factoryStartsConnection: boolean;

  constructor(socketFactory?: TcpSocketFactory) {
    this.socketFactory = socketFactory || defaultSocketFactory;
    this.factoryStartsConnection = !socketFactory;
  }

  send(endpoint: PlugEndpoint, frame: Uint8Array, timeoutMs: number, writeMayTransmit: boolean): Promise<Uint8Array> {
    try {
      validatePlugEndpoint(endpoint);
    } catch (error) {
      return Promise.reject(new TcpTransportError("NetworkUnavailable", error instanceof Error ? error.message : "Invalid plug endpoint.", false));
    }
    return new Promise<Uint8Array>((resolve, reject) => {
      let settled = false;
      let connected = false;
      let writePending = false;
      const decoder = new TpLinkFrameDecoder();
      let socket: TcpSocketLike | undefined;
      const connectTimeoutMs = Math.max(1, Math.min(timeoutMs, DEFAULT_NATIVE_CONNECT_TIMEOUT_MS));
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try { socket?.destroy(); } catch (_error) { /* best effort */ }
        reject(new TcpTransportError(
          connected && writeMayTransmit ? "Ambiguous" : "Timeout",
          "TP-Link TCP request timed out.",
          connected && writeMayTransmit,
        ));
      }, timeoutMs);
      const callbacks = {
        onConnected: () => {
          connected = true;
          if (!settled && socket) socket.write(frame);
          else if (!settled) writePending = true;
        },
        onData: (data: Uint8Array) => {
          let frames: Uint8Array[];
          try {
            frames = decoder.push(data);
          } catch (error) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try { socket?.destroy(); } catch (_destroyError) { /* best effort */ }
            reject(new TcpTransportError("ProtocolMalformed", String(error), connected && writeMayTransmit));
            return;
          }
          if (!settled && frames.length > 0) {
            settled = true;
            clearTimeout(timer);
            socket?.destroy();
            resolve(encodeResponseFrame(frames[0]));
          }
        },
        onError: (error: unknown) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new TcpTransportError(
            connected && writeMayTransmit ? "Ambiguous" : "NetworkUnavailable",
            String(error),
            connected && writeMayTransmit,
          ));
        },
        onClose: () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new TcpTransportError(
            decoderHasPartialFrame(decoder)
              ? "ProtocolMalformed"
              : connected && writeMayTransmit ? "Ambiguous" : "NetworkUnavailable",
            "TP-Link socket closed before a response.",
            connected && writeMayTransmit,
          ));
        },
      };
      try {
        socket = this.socketFactory(endpoint, callbacks, connectTimeoutMs);
        if (!settled && this.factoryStartsConnection && writePending) {
          writePending = false;
          socket.write(frame);
        }
      } catch (error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new TcpTransportError("NetworkUnavailable", String(error), false));
        return;
      }
      try {
        if (!this.factoryStartsConnection) {
          socket.connect({ host: endpoint.ipv4, port: endpoint.port, connectTimeout: connectTimeoutMs }, callbacks.onConnected);
        }
      } catch (error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new TcpTransportError("NetworkUnavailable", String(error), false));
      }
    });
  }
}

function decoderHasPartialFrame(decoder: TpLinkFrameDecoder): boolean {
  return decoder.hasBufferedData;
}

function encodeResponseFrame(payload: Uint8Array): Uint8Array {
  const frame = new Uint8Array(payload.length + 4);
  frame[0] = (payload.length >>> 24) & 0xff;
  frame[1] = (payload.length >>> 16) & 0xff;
  frame[2] = (payload.length >>> 8) & 0xff;
  frame[3] = payload.length & 0xff;
  frame.set(payload, 4);
  return frame;
}
