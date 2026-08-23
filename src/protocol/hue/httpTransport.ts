import { assertPrivateIpv4 } from "../../config/endpointValidation";
import { DiagnosticCategory } from "../../app/types";
import { redactDiagnosticMessage } from "./redaction";

export interface HueHttpResponse {
  readonly status: number;
  readonly ok: boolean;
  json(): Promise<unknown>;
  text?(): Promise<string>;
}

export interface HueHttpClient {
  request(url: string, init: RequestInit): Promise<HueHttpResponse>;
}

const fetchClient: HueHttpClient = {
  request: (url, init) => fetch(url, init) as unknown as Promise<HueHttpResponse>,
};

export type HueTransportCategory = Extract<
  DiagnosticCategory,
  "NetworkUnavailable" | "Timeout" | "ProtocolMalformed" | "ProtocolRejected" | "AuthenticationRejected" | "Ambiguous"
>;

export class HueTransportError extends Error {
  readonly category: HueTransportCategory;
  readonly possibleSend: boolean;
  readonly status?: number;

  constructor(category: HueTransportCategory, message: string, possibleSend: boolean, status?: number) {
    super(redactDiagnosticMessage(message));
    this.name = "HueTransportError";
    this.category = category;
    this.possibleSend = possibleSend;
    this.status = status;
  }
}

export interface HueRequestOptions {
  readonly timeoutMs?: number;
  readonly allowUnauthenticated?: boolean;
  readonly possibleSendOnTimeout?: boolean;
}

export class HueHttpTransport {
  readonly bridgeIpv4: string;
  readonly credential?: string;
  private readonly client: HueHttpClient;
  private readonly defaultTimeoutMs: number;

  constructor(
    bridgeIpv4: string,
    credential?: string,
    client: HueHttpClient = fetchClient,
    defaultTimeoutMs = 5000,
  ) {
    assertPrivateIpv4(bridgeIpv4);
    this.bridgeIpv4 = bridgeIpv4;
    this.credential = credential;
    this.client = client;
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  get httpClient(): HueHttpClient {
    return this.client;
  }

  get timeoutMs(): number {
    return this.defaultTimeoutMs;
  }

  withCredential(credential: string): HueHttpTransport {
    return new HueHttpTransport(this.bridgeIpv4, credential, this.client, this.defaultTimeoutMs);
  }

  async request(path: string, method: string, body?: unknown, options: HueRequestOptions = {}): Promise<unknown> {
    return this.requestInternal(path, method, body, { ...options, allowUnauthenticated: false });
  }

  async requestUnauthenticated(path: string, method: string, body?: unknown, options: HueRequestOptions = {}): Promise<unknown> {
    return this.requestInternal(path, method, body, { ...options, allowUnauthenticated: true });
  }

  private async requestInternal(
    path: string,
    method: string,
    body: unknown,
    options: HueRequestOptions,
  ): Promise<unknown> {
    if (!options.allowUnauthenticated && !this.credential) {
      throw new HueTransportError("AuthenticationRejected", "Hue credential is not available.", false);
    }
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const apiPrefix = options.allowUnauthenticated ? "/api" : `/api/${this.credential}`;
    const url = `http://${this.bridgeIpv4}${apiPrefix}${normalizedPath}`;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(controller ? { signal: controller.signal } : {}),
    };
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const possibleSendOnTimeout = options.possibleSendOnTimeout ?? method !== "GET";
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const request = this.client.request(url, init).catch((error) => {
      if (error instanceof HueTransportError) {
        throw error;
      }
      throw new HueTransportError(
        timedOut ? (possibleSendOnTimeout ? "Ambiguous" : "Timeout") : "NetworkUnavailable",
        String(error),
        possibleSendOnTimeout,
      );
    });
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        controller?.abort();
        reject(new HueTransportError(
          possibleSendOnTimeout ? "Ambiguous" : "Timeout",
          "Hue request timed out.",
          possibleSendOnTimeout,
        ));
      }, timeoutMs);
    });
    try {
      const response = await Promise.race([request, deadline]);
      if (!response.ok) {
        const category: HueTransportCategory = response.status === 401 || response.status === 403
          ? "AuthenticationRejected"
          : "ProtocolRejected";
        throw new HueTransportError(category, `Hue HTTP status ${response.status}.`, method !== "GET", response.status);
      }
      try {
        return await response.json();
      } catch (error) {
        throw new HueTransportError(
          method === "GET" ? "ProtocolMalformed" : "Ambiguous",
          "Hue returned malformed JSON.",
          method !== "GET",
        );
      }
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }
}
