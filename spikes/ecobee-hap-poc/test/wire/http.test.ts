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
    expect(parser.push(new TextEncoder().encode('EVENT/1.0\r\nContent-Length: 2\r\n\r\n{}'))[0].event).toBe(true);
    expect(() => serializeRequest('GET', 'https://example.invalid')).toThrow();
  });
});
