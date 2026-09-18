import TcpSocket from 'react-native-tcp-socket';
import type { ByteStream, Bytes, CancellationToken, NetworkEndpoint, TcpAdapter, WriteReceipt } from '../ports/contracts';
import { withTimeout } from '../ports/contracts';

export class ReactNativeTcpAdapter implements TcpAdapter {
  constructor(private readonly connectTimeoutMs = 8_000) {}

  async connect(endpoint: NetworkEndpoint, token?: CancellationToken): Promise<ByteStream> {
    return withTimeout((connectToken) => new Promise<ByteStream>((resolve, reject) => {
      if (connectToken.aborted) {
        reject(new Error(connectToken.reason ?? 'cancelled'));
        return;
      }
      let settled = false;
      let removeConnectCancel: (() => void) | undefined;
      let removeParentCancel: (() => void) | undefined;
      const cleanupCancellation = () => {
        removeConnectCancel?.();
        removeConnectCancel = undefined;
        removeParentCancel?.();
        removeParentCancel = undefined;
      };
      const socket = TcpSocket.createConnection({ host: endpoint.host, port: endpoint.port }, () => {
        if (settled) return;
        settled = true;
        cleanupCancellation();
        resolve(new ReactNativeByteStream(socket));
      });
      const onError = (error: unknown) => {
        if (!settled) {
          settled = true;
          cleanupCancellation();
          reject(error instanceof Error ? error : new Error('TCP connection failed'));
        }
      };
      socket.on('error', onError);
      socket.on('close', onError);
      removeConnectCancel = connectToken.onCancel(() => socket.destroy());
      removeParentCancel = token?.onCancel(() => socket.destroy());
    }), this.connectTimeoutMs, token);
  }
}

class ReactNativeByteStream implements ByteStream {
  private isClosed = false;
  private readonly dataListeners = new Set<(bytes: Bytes) => void>();
  private readonly errorListeners = new Set<(error: unknown) => void>();
  private readonly closeListeners = new Set<(reason?: string) => void>();

  constructor(private readonly socket: {
    on(event: string, listener: (...args: unknown[]) => void): void;
    write(data: Uint8Array): void;
    destroy(): void;
  }) {
    socket.on('data', (data) => this.dataListeners.forEach((listener) => listener(toBytes(data))));
    socket.on('error', (error) => this.errorListeners.forEach((listener) => listener(error)));
    socket.on('close', () => this.markClosed('socket-closed'));
  }

  get closed(): boolean {
    return this.isClosed;
  }

  async write(bytes: Bytes, token?: CancellationToken): Promise<WriteReceipt> {
    if (this.isClosed) throw new Error('TCP stream is closed');
    if (token?.aborted) throw new Error(token.reason ?? 'cancelled');
    this.socket.write(bytes);
    return { possiblyTransmitted: true };
  }

  onData(listener: (bytes: Bytes) => void): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  onError(listener: (error: unknown) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  onClose(listener: (reason?: string) => void): () => void {
    this.closeListeners.add(listener);
    return () => this.closeListeners.delete(listener);
  }

  close(reason = 'closed-by-controller'): void {
    if (this.isClosed) return;
    this.socket.destroy();
    this.markClosed(reason);
  }

  private markClosed(reason: string): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.closeListeners.forEach((listener) => listener(reason));
  }
}

function toBytes(value: unknown): Bytes {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (typeof value === 'string') return new TextEncoder().encode(value);
  throw new Error('TCP adapter returned unsupported data');
}
