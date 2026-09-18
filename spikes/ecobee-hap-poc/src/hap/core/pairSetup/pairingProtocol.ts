import { err, failure, ok, type Result } from '../../../application/result';
import type { Bytes, CryptoProvider } from '../../ports/contracts';
import { encodeTlv, TlvDocument } from '../wire/tlv8';
import { srp, type SrpClientPort } from '../../crypto/srp';
import { fromBase64, toBase64, type ControllerIdentity, type PairingRecord } from '../../credentials/record';

export const PairMethods = { pairSetup: 0, pairSetupWithAuth: 1, pairVerify: 2, addPairing: 3, removePairing: 4, listPairings: 5 } as const;

export const PairingTlv = {
  method: 0x00,
  identifier: 0x01,
  salt: 0x02,
  publicKey: 0x03,
  proof: 0x04,
  encryptedData: 0x05,
  state: 0x06,
  error: 0x07,
  retryDelay: 0x08,
  certificate: 0x09,
  signature: 0x0a,
  permissions: 0x0b
} as const;

const State = { m1: 1, m2: 2, m3: 3, m4: 4, m5: 5, m6: 6 } as const;

export class PairingProtocolError extends Error {
  readonly category = 'pairing-protocol';
  constructor(message: string, readonly pairingError?: number) {
    super(message);
    this.name = 'PairingProtocolError';
  }
}

export interface PairingSessionKeys {
  readonly controllerToAccessoryKey: Bytes;
  readonly accessoryToControllerKey: Bytes;
}

export interface PairingProtocolState {
  readonly controllerId: Bytes;
  readonly controllerPrivateKey: Bytes;
  readonly controllerPublicKey: Bytes;
  readonly accessoryId: Bytes;
  readonly accessoryPublicKey: Bytes;
}

export class PairingProtocol {
  private srpClient?: SrpClientPort;
  private setupSessionKey?: Bytes;
  private controllerIdentity?: { id: Bytes; privateKey: Bytes; publicKey: Bytes };
  private accessoryIdentity?: { id: Bytes; publicKey: Bytes };
  private verifyPrivateKey?: Bytes;
  private verifyPublicKey?: Bytes;
  private verifyAccessoryPublicKey?: Bytes;
  private sharedSecret?: Bytes;
  private sessionId?: Bytes;

  constructor(private readonly crypto: CryptoProvider, private readonly now: () => number = () => Date.now()) {}

  loadStoredPairing(record: PairingRecord): void {
    try {
      const controllerId = fromBase64(record.controllerId);
      const controllerPublicKey = fromBase64(record.controllerLongTermPublicKey);
      const controllerPrivateKey = fromBase64(record.controllerLongTermPrivateKey);
      const accessoryId = fromBase64(record.accessoryId);
      const accessoryPublicKey = fromBase64(record.accessoryLongTermPublicKey);
      if (controllerId.length === 0 || controllerId.length > 64 || controllerPublicKey.length !== 32 || controllerPrivateKey.length !== 64 || accessoryId.length === 0 || accessoryId.length > 64 || accessoryPublicKey.length !== 32) throw new Error('invalid pairing lengths');
      this.controllerIdentity = { id: controllerId, privateKey: controllerPrivateKey, publicKey: controllerPublicKey };
      this.accessoryIdentity = { id: accessoryId, publicKey: accessoryPublicKey };
    } catch {
      throw new PairingProtocolError('stored pairing record is invalid');
    }
  }

  loadControllerIdentity(identity: ControllerIdentity): void {
    try {
      const controllerId = fromBase64(identity.controllerId);
      const controllerPublicKey = fromBase64(identity.longTermPublicKey);
      const controllerPrivateKey = fromBase64(identity.longTermPrivateKey);
      if (controllerId.length === 0 || controllerId.length > 64 || controllerPublicKey.length !== 32 || controllerPrivateKey.length !== 64) {
        throw new Error('invalid controller identity lengths');
      }
      this.controllerIdentity = { id: controllerId, privateKey: controllerPrivateKey, publicKey: controllerPublicKey };
    } catch {
      throw new PairingProtocolError('stored controller identity is invalid');
    }
  }

  static validateSetupCode(setupCode: string): void {
    if (!/^\d{3}-\d{2}-\d{3}$/.test(setupCode)) throw new PairingProtocolError('setup code format is invalid');
    if (/^(\d)\1\1-\1\1-\1\1\1$/.test(setupCode)) {
      throw new PairingProtocolError('setup code is not allowed');
    }
    if (['000-00-000', '111-11-111', '222-22-222', '333-33-333', '444-44-444', '555-55-555', '666-66-666', '777-77-777', '888-88-888', '999-99-999', '123-45-678', '876-54-321'].includes(setupCode)) {
      throw new PairingProtocolError('setup code is not allowed');
    }
  }

  async buildPairSetupM1(method: number = PairMethods.pairSetupWithAuth): Promise<Bytes> {
    if (method !== PairMethods.pairSetup && method !== PairMethods.pairSetupWithAuth) throw new PairingProtocolError('unsupported pair setup method');
    return encodeTlv([{ type: PairingTlv.state, value: new Uint8Array([State.m1]) }, { type: PairingTlv.method, value: new Uint8Array([method]) }]);
  }

  parsePairSetupM2(input: Bytes): { salt: Bytes; publicKey: Bytes } {
    const tlv = this.parseState(input, State.m2, 'Pair Setup M2');
    const salt = required(tlv, PairingTlv.salt, 'Pair Setup M2 salt');
    const publicKey = required(tlv, PairingTlv.publicKey, 'Pair Setup M2 public key');
    return { salt, publicKey };
  }

  async buildPairSetupM3(m2: { salt: Bytes; publicKey: Bytes }, setupCode: string): Promise<Bytes> {
    PairingProtocol.validateSetupCode(setupCode);
    const privateKey = await srp.randomPrivateKey();
    this.srpClient = srp.create(m2.salt, utf8('Pair-Setup'), utf8(setupCode), privateKey);
    this.srpClient.setB(m2.publicKey);
    return encodeTlv([
      { type: PairingTlv.state, value: new Uint8Array([State.m3]) },
      { type: PairingTlv.publicKey, value: this.srpClient.computeA() },
      { type: PairingTlv.proof, value: this.srpClient.computeM1() }
    ]);
  }

  parsePairSetupM4(input: Bytes): void {
    const tlv = this.parseState(input, State.m4, 'Pair Setup M4');
    const proof = required(tlv, PairingTlv.proof, 'Pair Setup M4 proof');
    if (!this.srpClient) throw new PairingProtocolError('Pair Setup M3 was not built');
    try {
      this.srpClient.checkM2(proof);
    } catch {
      throw new PairingProtocolError('Pair Setup server proof did not verify');
    }
  }

  async buildPairSetupM5(): Promise<Bytes> {
    if (!this.srpClient) throw new PairingProtocolError('Pair Setup SRP session is missing');
    const controllerKeys = await this.crypto.ed25519KeyPair();
    const controllerId = utf8(formatUuid(await this.crypto.randomBytes(16)));
    this.controllerIdentity = { id: controllerId, privateKey: controllerKeys.privateKey, publicKey: controllerKeys.publicKey };
    const sharedSrpKey = this.srpClient.computeK();
    const signKey = await this.crypto.hkdfSha512(utf8('Pair-Setup-Controller-Sign-Salt'), utf8('Pair-Setup-Controller-Sign-Info'), sharedSrpKey, 32);
    const signature = await this.crypto.ed25519Sign(concat(signKey, controllerId, controllerKeys.publicKey), controllerKeys.privateKey);
    const subTlv = encodeTlv([
      { type: PairingTlv.identifier, value: controllerId },
      { type: PairingTlv.publicKey, value: controllerKeys.publicKey },
      { type: PairingTlv.signature, value: signature }
    ]);
    this.setupSessionKey = await this.crypto.hkdfSha512(utf8('Pair-Setup-Encrypt-Salt'), utf8('Pair-Setup-Encrypt-Info'), sharedSrpKey, 32);
    const encrypted = await this.crypto.aeadSeal(subTlv, new Uint8Array(), nonce('PS-Msg05'), this.setupSessionKey);
    return encodeTlv([{ type: PairingTlv.state, value: new Uint8Array([State.m5]) }, { type: PairingTlv.encryptedData, value: encrypted }]);
  }

  async parsePairSetupM6(input: Bytes): Promise<PairingProtocolState> {
    if (!this.srpClient || !this.setupSessionKey || !this.controllerIdentity) throw new PairingProtocolError('Pair Setup M5 was not built');
    const tlv = this.parseState(input, State.m6, 'Pair Setup M6');
    const encrypted = required(tlv, PairingTlv.encryptedData, 'Pair Setup M6 encrypted data');
    let subTlv: TlvDocument;
    try {
      subTlv = TlvDocument.parse(await this.crypto.aeadOpen(encrypted, new Uint8Array(), nonce('PS-Msg06'), this.setupSessionKey));
    } catch {
      throw new PairingProtocolError('Pair Setup M6 encrypted data did not authenticate');
    }
    const accessoryId = required(subTlv, PairingTlv.identifier, 'Pair Setup accessory identifier');
    const accessoryPublicKey = required(subTlv, PairingTlv.publicKey, 'Pair Setup accessory public key');
    const signature = required(subTlv, PairingTlv.signature, 'Pair Setup accessory signature');
    const signKey = await this.crypto.hkdfSha512(utf8('Pair-Setup-Accessory-Sign-Salt'), utf8('Pair-Setup-Accessory-Sign-Info'), this.srpClient.computeK(), 32);
    if (!await this.crypto.ed25519Verify(signature, concat(signKey, accessoryId, accessoryPublicKey), accessoryPublicKey)) {
      throw new PairingProtocolError('Pair Setup accessory signature did not verify');
    }
    this.accessoryIdentity = { id: accessoryId, publicKey: accessoryPublicKey };
    return { controllerId: this.controllerIdentity.id, controllerPrivateKey: this.controllerIdentity.privateKey, controllerPublicKey: this.controllerIdentity.publicKey, accessoryId, accessoryPublicKey };
  }

  async buildPairVerifyM1(): Promise<Bytes> {
    const keyPair = await this.crypto.x25519KeyPair();
    this.verifyPrivateKey = keyPair.privateKey;
    this.verifyPublicKey = keyPair.publicKey;
    return encodeTlv([{ type: PairingTlv.state, value: new Uint8Array([State.m1]) }, { type: PairingTlv.publicKey, value: keyPair.publicKey }]);
  }

  async parsePairVerifyM2(input: Bytes): Promise<void> {
    if (!this.verifyPrivateKey || !this.verifyPublicKey || !this.accessoryIdentity) throw new PairingProtocolError('Pair Verify M1 or Pair Setup identity is missing');
    const tlv = this.parseState(input, State.m2, 'Pair Verify M2');
    const accessoryPublicKey = required(tlv, PairingTlv.publicKey, 'Pair Verify accessory ephemeral public key');
    const encrypted = required(tlv, PairingTlv.encryptedData, 'Pair Verify M2 encrypted data');
    this.verifyAccessoryPublicKey = accessoryPublicKey;
    this.sharedSecret = await this.crypto.x25519(this.verifyPrivateKey, accessoryPublicKey);
    const verifyKey = await this.crypto.hkdfSha512(utf8('Pair-Verify-Encrypt-Salt'), utf8('Pair-Verify-Encrypt-Info'), this.sharedSecret, 32);
    this.sessionId = await this.crypto.hkdfSha512(utf8('Pair-Verify-Resume-Salt'), utf8('Pair-Verify-Resume-Info'), this.sharedSecret, 8);
    let subTlv: TlvDocument;
    try {
      subTlv = TlvDocument.parse(await this.crypto.aeadOpen(encrypted, new Uint8Array(), nonce('PV-Msg02'), verifyKey));
    } catch {
      throw new PairingProtocolError('Pair Verify M2 encrypted data did not authenticate');
    }
    const identity = required(subTlv, PairingTlv.identifier, 'Pair Verify accessory identifier');
    const signature = required(subTlv, PairingTlv.signature, 'Pair Verify accessory signature');
    if (!bytesEqual(identity, this.accessoryIdentity.id)) throw new PairingProtocolError('Pair Verify accessory identity mismatch');
    if (!await this.crypto.ed25519Verify(signature, concat(accessoryPublicKey, this.accessoryIdentity.id, this.verifyPublicKey), this.accessoryIdentity.publicKey)) {
      throw new PairingProtocolError('Pair Verify accessory signature did not verify');
    }
  }

  async buildPairVerifyM3(): Promise<Bytes> {
    if (!this.verifyPublicKey || !this.verifyAccessoryPublicKey || !this.sessionId || !this.controllerIdentity || !this.sharedSecret) throw new PairingProtocolError('Pair Verify M2 state is missing');
    const signature = await this.crypto.ed25519Sign(concat(this.verifyPublicKey, this.controllerIdentity.id, this.verifyAccessoryPublicKey), this.controllerIdentity.privateKey);
    const subTlv = encodeTlv([{ type: PairingTlv.identifier, value: this.controllerIdentity.id }, { type: PairingTlv.signature, value: signature }]);
    const verifyKey = await this.crypto.hkdfSha512(utf8('Pair-Verify-Encrypt-Salt'), utf8('Pair-Verify-Encrypt-Info'), this.sharedSecret, 32);
    const encrypted = await this.crypto.aeadSeal(subTlv, new Uint8Array(), nonce('PV-Msg03'), verifyKey);
    return encodeTlv([{ type: PairingTlv.state, value: new Uint8Array([State.m3]) }, { type: PairingTlv.encryptedData, value: encrypted }]);
  }

  parsePairVerifyM4(input: Bytes): void {
    this.parseState(input, State.m4, 'Pair Verify M4');
  }

  async getSessionKeys(): Promise<PairingSessionKeys> {
    if (!this.sharedSecret) throw new PairingProtocolError('Pair Verify shared secret is missing');
    return {
      controllerToAccessoryKey: await this.crypto.hkdfSha512(utf8('Control-Salt'), utf8('Control-Write-Encryption-Key'), this.sharedSecret, 32),
      accessoryToControllerKey: await this.crypto.hkdfSha512(utf8('Control-Salt'), utf8('Control-Read-Encryption-Key'), this.sharedSecret, 32)
    };
  }

  getPairingRecord(): PairingRecord {
    if (!this.controllerIdentity || !this.accessoryIdentity) throw new PairingProtocolError('Pair Setup did not produce a complete record');
    return {
      schemaVersion: 1,
      accessoryId: toBase64(this.accessoryIdentity.id),
      accessoryLongTermPublicKey: toBase64(this.accessoryIdentity.publicKey),
      controllerId: toBase64(this.controllerIdentity.id),
      controllerLongTermPublicKey: toBase64(this.controllerIdentity.publicKey),
      controllerLongTermPrivateKey: toBase64(this.controllerIdentity.privateKey),
      pairedAtEpochMs: this.now()
    };
  }

  private parseState(input: Bytes, expected: number, label: string): TlvDocument {
    let tlv: TlvDocument;
    try {
      tlv = TlvDocument.parse(input);
    } catch {
      throw new PairingProtocolError(`${label}: malformed TLV`);
    }
    const error = tlv.get(PairingTlv.error);
    if (error && error.length === 1) throw new PairingProtocolError(`${label}: accessory rejected operation`, error[0]);
    const state = required(tlv, PairingTlv.state, `${label} state`);
    if (state.length !== 1 || state[0] !== expected) throw new PairingProtocolError(`${label}: unexpected state`);
    return tlv;
  }
}

export function concat(...parts: readonly Bytes[]): Bytes {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  parts.forEach((part) => { result.set(part, offset); offset += part.length; });
  return result;
}

function required(tlv: TlvDocument, type: number, label: string): Bytes {
  const value = tlv.get(type);
  if (!value || value.length === 0) throw new PairingProtocolError(`${label} is missing`);
  return value;
}

function utf8(value: string): Bytes {
  return new TextEncoder().encode(value);
}

function nonce(label: string): Bytes {
  return concat(new Uint8Array(4), utf8(label));
}

function bytesEqual(first: Bytes, second: Bytes): boolean {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index];
  return difference === 0;
}

function formatUuid(bytes: Bytes): string {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
