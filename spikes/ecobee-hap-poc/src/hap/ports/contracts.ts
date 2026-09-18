import type { OperationFailure, Result } from '../../application/result';

export type Bytes = Uint8Array;

export interface Clock {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

export interface CancellationToken {
  readonly aborted: boolean;
  readonly reason?: string;
  onCancel(listener: () => void): () => void;
}

export interface CancellationSource {
  readonly token: CancellationToken;
  cancel(reason?: string): void;
}

export class CancellationController implements CancellationSource {
  private cancelled = false;
  private cancelReason: string | undefined;
  private listeners = new Set<() => void>();

  readonly token: CancellationToken;

  constructor() {
    const owner = this;
    this.token = {
      get aborted() {
        return owner.cancelled;
      },
      get reason() {
        return owner.cancelReason;
      },
      onCancel(listener) {
        if (owner.cancelled) {
          listener();
          return () => undefined;
        }
        owner.listeners.add(listener);
        return () => owner.listeners.delete(listener);
      }
    };
  }

  cancel(reason = 'cancelled'): void {
    if (this.cancelled) return;
    this.cancelled = true;
    this.cancelReason = reason;
    const listeners = [...this.listeners];
    this.listeners.clear();
    listeners.forEach((listener) => listener());
  }
}

export async function withTimeout<T>(
  operation: (token: CancellationToken) => Promise<T>,
  timeoutMs: number,
  parent?: CancellationToken,
  clock: Clock = systemClock
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('timeout must be a positive finite duration');
  }
  const controller = new CancellationController();
  const removeParent = parent?.onCancel(() => controller.cancel(parent.reason));
  let timer: unknown;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = clock.setTimeout(() => {
        controller.cancel('timeout');
        reject(new Error('operation timed out'));
      }, timeoutMs);
    });
    return await Promise.race([operation(controller.token), timeout]);
  } finally {
    if (timer !== undefined) clock.clearTimeout(timer);
    removeParent?.();
    controller.cancel('operation finished');
  }
}

export interface NetworkEndpoint {
  readonly host: string;
  readonly port: number;
  readonly interfaceId: string;
  readonly addressFamily: 'ipv4' | 'ipv6';
  readonly networkCidr?: string;
}

export interface WriteReceipt {
  /** True when bytes may have reached the kernel/accessory. */
  readonly possiblyTransmitted: boolean;
}

export interface ByteStream {
  write(bytes: Bytes, token?: CancellationToken): Promise<WriteReceipt>;
  onData(listener: (bytes: Bytes) => void): () => void;
  onError(listener: (error: unknown) => void): () => void;
  onClose(listener: (reason?: string) => void): () => void;
  close(reason?: string): void;
  readonly closed: boolean;
}

export interface TcpAdapter {
  connect(endpoint: NetworkEndpoint, token?: CancellationToken): Promise<ByteStream>;
}

export interface RawDnsSdService {
  readonly name: string;
  readonly type: string;
  readonly domain: string;
  readonly hostName: string;
  readonly addresses: readonly string[];
  readonly port: number;
  readonly txt: Readonly<Record<string, string>>;
  readonly interfaceId?: string;
  readonly networkCidr?: string;
}

export interface DiscoveryEvents {
  found(service: RawDnsSdService): void;
  lost(service: RawDnsSdService): void;
  changed(service: RawDnsSdService): void;
}

export interface DnsSdAdapter {
  start(serviceType: '_hap._tcp', events: DiscoveryEvents): Promise<void>;
  stop(serviceType: '_hap._tcp'): Promise<void>;
}

export interface LocalNetworkSnapshot {
  /** True only when the active Wi-Fi transport and at least one IPv4 CIDR are known. */
  readonly available: boolean;
  readonly activeInterfaceIds: readonly string[];
  readonly ipv4Cidrs: readonly string[];
}

export interface HapCandidate {
  readonly key: string;
  readonly displayName: string;
  readonly serviceType: '_hap._tcp';
  readonly endpoint: NetworkEndpoint;
  readonly pairing: 'available' | 'already-associated' | 'unknown';
  readonly accessoryIdentityHint?: string;
  readonly generation: number;
}

export interface CryptoKeyPair {
  readonly publicKey: Bytes;
  readonly privateKey: Bytes;
}

export interface CryptoProvider {
  readonly name: string;
  ready(): Promise<void>;
  randomBytes(length: number): Promise<Bytes>;
  sha512(input: Bytes): Promise<Bytes>;
  hmacSha512(key: Bytes, input: Bytes): Promise<Bytes>;
  hkdfSha512(salt: Bytes, info: Bytes, input: Bytes, length: number): Promise<Bytes>;
  x25519KeyPair(privateKey?: Bytes): Promise<CryptoKeyPair>;
  x25519(privateKey: Bytes, publicKey: Bytes): Promise<Bytes>;
  ed25519KeyPair(seed?: Bytes): Promise<CryptoKeyPair>;
  ed25519Sign(message: Bytes, privateKey: Bytes): Promise<Bytes>;
  ed25519Verify(signature: Bytes, message: Bytes, publicKey: Bytes): Promise<boolean>;
  aeadSeal(plaintext: Bytes, aad: Bytes, nonce: Bytes, key: Bytes): Promise<Bytes>;
  aeadOpen(ciphertextAndTag: Bytes, aad: Bytes, nonce: Bytes, key: Bytes): Promise<Bytes>;
}

export interface SecureValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface SafeLogger {
  event(name: string, fields?: SafeLogFields): void;
  error(name: string, fields?: SafeLogFields): void;
}

export type SafeLogFields = Partial<{
  phase: string;
  operation: string;
  result: 'started' | 'success' | 'failure' | 'cancelled' | 'ambiguous' | 'repair-required';
  durationMs: number;
  accessoryAlias: string;
  addressFamily: 'ipv4' | 'ipv6';
  errorCategory: string;
  retryCount: number;
  generation: number;
  transportState: 'connecting' | 'open' | 'closing' | 'closed';
  detail: string;
}>;

export interface HapSessionApi {
  request(method: 'GET' | 'PUT' | 'POST', path: string, body?: Bytes, contentType?: string): Promise<HapResponse>;
  close(): Promise<void>;
  readonly generation: number;
}

export interface HapResponse {
  readonly statusCode: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Bytes;
}

export type SessionResult<T> = Result<T, OperationFailure>;
