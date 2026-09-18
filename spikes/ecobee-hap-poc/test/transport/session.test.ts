import { HapHttpSession } from '../../src/hap/transport/httpSession';
import { SodiumCryptoProvider } from '../../src/hap/crypto/sodiumProvider';
import { FakeClock } from '../fakes/clock';
import { ScriptedByteStream } from '../fakes/byteStream';

describe('HAP session transport', () => {
  it('keeps arbitrary TCP fragmentation separate from HTTP messages', async () => {
    const stream = new ScriptedByteStream();
    const session = new HapHttpSession(stream, new SodiumCryptoProvider(), 4, new FakeClock(), undefined, 1000);
    const request = session.request('GET', '/accessories');
    const response = new TextEncoder().encode('HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\n{}');
    for (let index = 0; index < response.length; index += 2) stream.emitData(response.subarray(index, index + 2));
    await expect(request).resolves.toMatchObject({ statusCode: 200, body: new Uint8Array([123, 125]) });
    await session.close();
    expect(stream.closed).toBe(true);
  });

  it('closes exactly once on stream terminal events', async () => {
    const stream = new ScriptedByteStream();
    const session = new HapHttpSession(stream, new SodiumCryptoProvider(), 1, new FakeClock());
    stream.emitError(new Error('timeout'));
    stream.close('socket-closed');
    await expect(session.request('GET', '/accessories')).rejects.toThrow('closed');
    await session.close();
    expect(stream.closed).toBe(true);
  });
});
