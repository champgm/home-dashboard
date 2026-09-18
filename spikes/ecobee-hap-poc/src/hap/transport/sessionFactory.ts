import type { CryptoProvider, NetworkEndpoint } from '../ports/contracts';
import { HapHttpSession } from './httpSession';
import type { TcpAdapter } from '../ports/contracts';
import type { Clock, SafeLogger } from '../ports/contracts';

export class TcpSessionTransportFactory {
  constructor(
    private readonly tcp: TcpAdapter,
    private readonly crypto: CryptoProvider,
    private readonly clock: Clock,
    private readonly logger?: SafeLogger
  ) {}

  async connect(endpoint: NetworkEndpoint, generation: number): Promise<HapHttpSession> {
    const stream = await this.tcp.connect(endpoint);
    return new HapHttpSession(stream, this.crypto, generation, this.clock, this.logger);
  }
}

export async function postTlv(session: HapHttpSession, path: '/pair-setup' | '/pair-verify', body: Uint8Array): Promise<Uint8Array> {
  const response = await session.request('POST', path, body, 'application/pairing+tlv8');
  if (response.statusCode !== 200 && response.statusCode !== 204) throw new Error(`HAP pairing endpoint returned status ${response.statusCode}`);
  return response.body;
}
