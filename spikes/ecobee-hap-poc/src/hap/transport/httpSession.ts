import type { ByteStream, Bytes, CancellationToken, HapResponse, HapSessionApi, SafeLogger, Clock } from '../ports/contracts';
import { withTimeout } from '../ports/contracts';
import { EncryptedRecordDecoder, EncryptedRecordEncoder } from '../core/wire/encryptedRecords';
import { IncrementalHttpParser, serializeRequest, toResponse, type HapHttpMessage } from '../core/wire/http';
import type { CryptoProvider } from '../ports/contracts';

export interface HapEvent {
  readonly body: Bytes;
  readonly headers: Readonly<Record<string, string>>;
}

export class HapHttpSession implements HapSessionApi {
  private readonly parser = new IncrementalHttpParser();
  private readonly removeData: () => void;
  private readonly removeError: () => void;
  private readonly removeClose: () => void;
  private processing: Promise<void> = Promise.resolve();
  private pending?: { resolve: (response: HapResponse) => void; reject: (error: unknown) => void };
  private requestTail: Promise<void> = Promise.resolve();
  private encryptedEncoder?: EncryptedRecordEncoder;
  private encryptedDecoder?: EncryptedRecordDecoder;
  private eventListener?: (event: HapEvent) => void;
  private isClosed = false;

  constructor(
    private readonly stream: ByteStream,
    private readonly crypto: CryptoProvider,
    readonly generation: number,
    private readonly clock: Clock,
    private readonly logger?: SafeLogger,
    private readonly requestTimeoutMs = 8_000
  ) {
    this.removeData = stream.onData((bytes) => {
      this.processing = this.processing.then(() => this.consume(bytes)).catch((error) => this.fail(error));
    });
    this.removeError = stream.onError((error) => this.fail(error));
    this.removeClose = stream.onClose((reason) => this.fail(new Error(reason ?? 'session closed')));
  }

  setEventListener(listener: (event: HapEvent) => void): void {
    this.eventListener = listener;
  }

  setSessionKeys(controllerToAccessoryKey: Bytes, accessoryToControllerKey: Bytes): void {
    this.encryptedEncoder = new EncryptedRecordEncoder(this.crypto, controllerToAccessoryKey);
    this.encryptedDecoder = new EncryptedRecordDecoder(this.crypto, accessoryToControllerKey);
  }

  async request(method: 'GET' | 'PUT' | 'POST', path: string, body: Bytes = new Uint8Array(), contentType = 'application/hap+json'): Promise<HapResponse> {
    const previous = this.requestTail;
    let release!: () => void;
    this.requestTail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      if (this.isClosed) throw new Error('HAP session is closed');
      const plain = serializeRequest(method, path, body, contentType);
      const wire = this.encryptedEncoder ? await this.encryptedEncoder.encode(plain) : plain;
      const response = new Promise<HapResponse>((resolve, reject) => {
        if (this.pending) {
          reject(new Error('concurrent HAP request was not serialized'));
          return;
        }
        this.pending = { resolve, reject };
      });
      try {
        await withTimeout((token) => this.stream.write(wire, token), this.requestTimeoutMs, undefined, this.clock);
        return await withTimeout(() => response, this.requestTimeoutMs, undefined, this.clock);
      } finally {
        this.pending = undefined;
      }
    } finally {
      release();
    }
  }

  async close(): Promise<void> {
    if (this.isClosed) return;
    this.isClosed = true;
    this.removeData();
    this.removeError();
    this.removeClose();
    this.pending?.reject(new Error('HAP session closed by controller'));
    this.pending = undefined;
    try {
      this.parser.finish();
      this.encryptedDecoder?.finish();
    } catch {
      // A controller close is terminal; the caller already knows the session ended.
    }
    this.stream.close('session-closed');
  }

  private async consume(input: Bytes): Promise<void> {
    if (this.isClosed) return;
    const plainChunks = this.encryptedDecoder ? await this.encryptedDecoder.push(input) : [input];
    for (const plain of plainChunks) {
      const messages = this.parser.push(plain);
      messages.forEach((message) => this.handleMessage(message));
    }
  }

  private handleMessage(message: HapHttpMessage): void {
    if (message.event) {
      this.eventListener?.({ body: message.body, headers: message.headers });
      return;
    }
    if (!this.pending) {
      this.logger?.error('session.unexpected-response', { operation: 'hap-http', result: 'failure', errorCategory: 'unexpected-response', generation: this.generation });
      return;
    }
    this.pending.resolve(toResponse(message));
  }

  private fail(error: unknown): void {
    if (this.isClosed) return;
    this.isClosed = true;
    this.pending?.reject(error);
    this.pending = undefined;
    this.removeData();
    this.removeError();
    this.removeClose();
    try { this.stream.close('session-transport-failed'); } catch { /* terminal transport failure */ }
    this.logger?.error('session.transport-failed', { operation: 'hap-session', result: 'failure', errorCategory: error instanceof Error ? error.name.toLowerCase() : 'transport-error', generation: this.generation });
  }
}
