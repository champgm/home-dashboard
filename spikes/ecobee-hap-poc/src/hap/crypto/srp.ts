import { Buffer } from 'react-native-quick-crypto';
import { SRP, SrpClient } from 'fast-srp-hap';
import type { Bytes } from '../ports/contracts';

export interface SrpClientPort {
  computeA(): Bytes;
  setB(publicKey: Bytes): void;
  computeM1(): Bytes;
  checkM2(proof: Bytes): void;
  computeK(): Bytes;
}

export interface SrpClientFactory {
  create(salt: Bytes, identity: Bytes, password: Bytes, privateKey: Bytes): SrpClientPort;
  randomPrivateKey(length?: number): Promise<Bytes>;
}

/**
 * React Native SRP boundary. Metro maps fast-srp-hap's Node `crypto` import to
 * react-native-quick-crypto, and this adapter takes the matching Buffer export
 * from that module; the upstream SRP math stays behind this narrow port.
 */
export class ReactNativeSrpAdapter implements SrpClientFactory {
  create(salt: Bytes, identity: Bytes, password: Bytes, privateKey: Bytes): SrpClientPort {
    const client = new SrpClient(
      SRP.params.hap,
      toSrpBuffer(salt),
      toSrpBuffer(identity),
      toSrpBuffer(password),
      toSrpBuffer(privateKey)
    );
    return {
      computeA: () => new Uint8Array(client.computeA()),
      setB: (publicKey) => client.setB(toSrpBuffer(publicKey)),
      computeM1: () => new Uint8Array(client.computeM1()),
      checkM2: (proof) => client.checkM2(toSrpBuffer(proof)),
      computeK: () => new Uint8Array(client.computeK())
    };
  }

  async randomPrivateKey(length = 32): Promise<Bytes> {
    return new Uint8Array(await SRP.genKey(length));
  }
}

// fast-srp-hap publishes Node's generic Buffer type while the React Native
// provider publishes its compatible native Buffer type. Keep the runtime
// object native and confine the declaration mismatch to this boundary.
function toSrpBuffer(value: Bytes): ConstructorParameters<typeof SrpClient>[1] {
  return Buffer.from(value) as unknown as ConstructorParameters<typeof SrpClient>[1];
}

/** Retained test/source name for callers that only exercise the SRP math. */
export class FastSrpHapAdapter extends ReactNativeSrpAdapter {}

export const srp = new ReactNativeSrpAdapter();
