import type { Bytes, HapResponse } from '../../ports/contracts';

const MAX_HEADERS = 16_384;
const MAX_BODY = 1_048_576;

export interface HapHttpMessage {
  readonly version: '1.0' | '1.1';
  readonly method?: 'GET' | 'PUT' | 'POST';
  readonly path?: string;
  readonly statusCode?: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Bytes;
  readonly event: boolean;
}

export class IncrementalHttpParser {
  private buffer: Bytes = new Uint8Array() as Bytes;

  constructor(private readonly maxBody = MAX_BODY) {}

  push(chunk: Bytes): HapHttpMessage[] {
    this.buffer = concat(this.buffer, chunk);
    const messages: HapHttpMessage[] = [];
    while (true) {
      const headerEnd = indexOf(this.buffer, new Uint8Array([13, 10, 13, 10]));
      if (headerEnd < 0) {
        if (this.buffer.length > MAX_HEADERS) throw new Error('HTTP headers exceed bound');
        break;
      }
      const headerBytes = this.buffer.subarray(0, headerEnd);
      const headerText = new TextDecoder().decode(headerBytes);
      const lines = headerText.split('\r\n');
      const start = lines.shift() ?? '';
      const headers: Record<string, string> = {};
      lines.forEach((line) => {
        const separator = line.indexOf(':');
        if (separator <= 0) throw new Error('malformed HTTP header');
        const key = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();
        if (!/^[a-z0-9-]+$/.test(key)) throw new Error('invalid HTTP header name');
        headers[key] = value;
      });
      const contentLengthText = headers['content-length'] ?? '0';
      if (!/^\d+$/.test(contentLengthText)) throw new Error('invalid HTTP content length');
      const contentLength = Number(contentLengthText);
      if (!Number.isSafeInteger(contentLength) || contentLength > this.maxBody) throw new Error('HTTP body exceeds bound');
      const messageEnd = headerEnd + 4 + contentLength;
      if (this.buffer.length < messageEnd) break;
      const body = new Uint8Array(this.buffer.subarray(headerEnd + 4, messageEnd));
      this.buffer = this.buffer.subarray(messageEnd);
      messages.push(parseStartLine(start, headers, body));
    }
    return messages;
  }

  finish(): void {
    if (this.buffer.length !== 0) throw new Error('truncated HTTP message');
  }
}

export function serializeRequest(method: 'GET' | 'PUT' | 'POST', path: string, body: Bytes = new Uint8Array(), contentType = 'application/hap+json'): Bytes {
  if (!/^\/(?:[A-Za-z0-9._?=&%+,-]|\/)+$/.test(path)) throw new Error('invalid HAP path');
  const head = `${method} ${path} HTTP/1.1\r\nHost: ecobee-hap-poc\r\nContent-Type: ${contentType}\r\nContent-Length: ${body.length}\r\n\r\n`;
  return concat(new TextEncoder().encode(head), body);
}

export function toResponse(message: HapHttpMessage): HapResponse {
  if (message.statusCode === undefined) throw new Error('HTTP message is not a response');
  return { statusCode: message.statusCode, headers: message.headers, body: message.body };
}

function parseStartLine(start: string, headers: Readonly<Record<string, string>>, body: Bytes): HapHttpMessage {
  const parts = start.split(' ');
  if (parts[0] === 'EVENT/1.0' && parts.length === 1) return { version: '1.0', headers, body, event: true };
  if (parts[0] === 'HTTP/1.1' || parts[0] === 'HTTP/1.0') {
    const statusCode = Number(parts[1]);
    if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) throw new Error('invalid HTTP status');
    return { version: parts[0].slice(5) as '1.0' | '1.1', statusCode, headers, body, event: false };
  }
  if (parts.length === 3 && ['GET', 'PUT', 'POST'].includes(parts[0])) {
    if (!parts[1].startsWith('/')) throw new Error('invalid HTTP request path');
    return { version: parts[2].slice(5) as '1.0' | '1.1', method: parts[0] as 'GET' | 'PUT' | 'POST', path: parts[1], headers, body, event: false };
  }
  throw new Error('invalid HTTP start line');
}

function concat(first: Bytes, second: Bytes): Bytes {
  const result = new Uint8Array(first.length + second.length);
  result.set(first, 0);
  result.set(second, first.length);
  return result;
}

function indexOf(haystack: Bytes, needle: Bytes): number {
  outer: for (let index = 0; index <= haystack.length - needle.length; index += 1) {
    for (let offset = 0; offset < needle.length; offset += 1) if (haystack[index + offset] !== needle[offset]) continue outer;
    return index;
  }
  return -1;
}
