import type { ByteStream, Bytes, CancellationToken, WriteReceipt } from '../../src/hap/ports/contracts';

export class ScriptedByteStream implements ByteStream {
  closed = false;
  readonly writes: Bytes[] = [];
  possibleSend = false;
  private dataListeners = new Set<(bytes: Bytes) => void>();
  private errorListeners = new Set<(error: unknown) => void>();
  private closeListeners = new Set<(reason?: string) => void>();

  async write(bytes: Bytes, token?: CancellationToken): Promise<WriteReceipt> {
    if (this.closed) throw new Error('closed');
    if (token?.aborted) throw new Error(token.reason ?? 'cancelled');
    this.writes.push(new Uint8Array(bytes));
    if (this.possibleSend) throw new Error('possible-send');
    return { possiblyTransmitted: true };
  }
  onData(listener: (bytes: Bytes) => void): () => void { this.dataListeners.add(listener); return () => this.dataListeners.delete(listener); }
  onError(listener: (error: unknown) => void): () => void { this.errorListeners.add(listener); return () => this.errorListeners.delete(listener); }
  onClose(listener: (reason?: string) => void): () => void { this.closeListeners.add(listener); return () => this.closeListeners.delete(listener); }
  close(reason = 'closed'): void { if (this.closed) return; this.closed = true; this.closeListeners.forEach((listener) => listener(reason)); }
  emitData(bytes: Bytes): void { this.dataListeners.forEach((listener) => listener(bytes)); }
  emitError(error: unknown): void { this.errorListeners.forEach((listener) => listener(error)); }
}
