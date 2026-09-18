import TcpSocket from 'react-native-tcp-socket';
import { ReactNativeTcpAdapter } from '../../src/hap/transport/nativeTcp';

describe('native TCP adapter', () => {
  it('does not let timeout-scope cancellation destroy a successful socket', async () => {
    const socket = new FakeSocket();
    (TcpSocket.createConnection as jest.Mock).mockImplementation((_options: unknown, onConnect: () => void) => {
      queueMicrotask(onConnect);
      return socket;
    });

    const stream = await new ReactNativeTcpAdapter(1_000).connect({ host: '192.168.50.40', port: 12345, interfaceId: 'wifi0', addressFamily: 'ipv4' });
    expect(socket.destroy).not.toHaveBeenCalled();
    stream.close();
    expect(socket.destroy).toHaveBeenCalledTimes(1);
  });
});

class FakeSocket {
  readonly destroy = jest.fn();
  private readonly listeners = new Map<string, (...args: unknown[]) => void>();

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.listeners.set(event, listener);
  }

  write(_data: Uint8Array): void {
    // The adapter test covers connection ownership, not wire delivery.
  }
}
