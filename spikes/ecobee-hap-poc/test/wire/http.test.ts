import { IncrementalHttpParser, serializeRequest } from '../../src/hap/core/wire/http';

describe('incremental HAP HTTP', () => {
  it('parses headers/body across arbitrary fragments and coalesced messages', () => {
    const parser = new IncrementalHttpParser();
    const encoded = new Uint8Array([...serializeRequest('POST', '/pair-setup', new Uint8Array([1, 2]), 'application/pairing+tlv8'), ...new TextEncoder().encode('HTTP/1.1 204 No Content\r\nContent-Length: 0\r\n\r\n')]);
    const messages = [] as ReturnType<typeof parser.push>;
    for (let index = 0; index < encoded.length; index += 3) messages.push(...parser.push(encoded.subarray(index, index + 3)));
    expect(messages[0]).toMatchObject({ method: 'POST', path: '/pair-setup', body: new Uint8Array([1, 2]) });
    expect(messages[1]).toMatchObject({ statusCode: 204, body: new Uint8Array() });
  });

  it('parses HAP event messages and rejects unsafe paths', () => {
    const parser = new IncrementalHttpParser();
    expect(parser.push(new TextEncoder().encode('EVENT/1.0 200 OK\r\nContent-Length: 2\r\n\r\n{}'))[0]).toMatchObject({ event: true, statusCode: 200 });
    expect(() => new IncrementalHttpParser().push(new TextEncoder().encode('EVENT/1.0\r\nContent-Length: 2\r\n\r\n{}'))).toThrow('event status line');
    expect(() => serializeRequest('GET', 'https://example.invalid')).toThrow();
  });

  it('incrementally decodes a chunked body and preserves the following message', () => {
    const parser = new IncrementalHttpParser();
    const encoded = new TextEncoder().encode(
      'HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nContent-Type: application/hap+json\r\n\r\n' +
      '5\r\n{"acc\r\n7;source=hap\r\ness":1}\r\n0\r\nX-Safe: yes\r\n\r\n' +
      'EVENT/1.0 200 OK\r\nContent-Length: 2\r\n\r\n{}'
    );
    const messages = [] as ReturnType<typeof parser.push>;
    for (let index = 0; index < encoded.length; index += 2) messages.push(...parser.push(encoded.subarray(index, index + 2)));

    expect(new TextDecoder().decode(messages[0].body)).toBe('{"access":1}');
    expect(messages[1].event).toBe(true);
    parser.finish();
  });

  it('rejects ambiguous or malformed chunk framing', () => {
    const ambiguous = new IncrementalHttpParser();
    expect(() => ambiguous.push(new TextEncoder().encode('HTTP/1.1 200 OK\r\nContent-Length: 2\r\nTransfer-Encoding: chunked\r\n\r\n'))).toThrow('ambiguous');
    const malformed = new IncrementalHttpParser();
    expect(() => malformed.push(new TextEncoder().encode('HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\nZ\r\n'))).toThrow('chunk size');
  });
});
