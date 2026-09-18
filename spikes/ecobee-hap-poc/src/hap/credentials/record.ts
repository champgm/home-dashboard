import { Buffer } from 'buffer';
import type { Bytes } from '../ports/contracts';

export const CREDENTIAL_SCHEMA_VERSION = 1 as const;

export interface ControllerIdentity {
  readonly schemaVersion: typeof CREDENTIAL_SCHEMA_VERSION;
  readonly controllerId: string;
  readonly longTermPublicKey: string;
  readonly longTermPrivateKey: string;
}

export interface PairingRecord {
  readonly schemaVersion: typeof CREDENTIAL_SCHEMA_VERSION;
  readonly accessoryId: string;
  readonly accessoryLongTermPublicKey: string;
  readonly controllerId: string;
  readonly controllerLongTermPublicKey: string;
  readonly controllerLongTermPrivateKey: string;
  readonly pairedAtEpochMs: number;
}

export type StoredRecord = ControllerIdentity | PairingRecord;

export type CredentialInspection =
  | { readonly state: 'missing' }
  | { readonly state: 'ready'; readonly record: StoredRecord }
  | { readonly state: 'corrupt'; readonly reason: 'invalid-json' | 'invalid-base64' | 'invalid-shape' }
  | { readonly state: 'partial'; readonly reason: string }
  | { readonly state: 'incompatible'; readonly version: number }
  | { readonly state: 'repair-required'; readonly reason: string };

export interface PairingRepairState {
  readonly state: 'repair-required';
  readonly reason: 'accessory-commit-unknown' | 'verify-failed' | 'accessory-removal-unknown';
  readonly accessoryAlias: string;
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

function isBase64(value: unknown, expectedBytes: number | { min: number; max: number }): value is string {
  if (typeof value !== 'string' || value.length === 0 || !BASE64.test(value)) return false;
  try {
    const decoded = fromBase64(value);
    return typeof expectedBytes === 'number'
      ? decoded.byteLength === expectedBytes
      : decoded.byteLength >= expectedBytes.min && decoded.byteLength <= expectedBytes.max;
  } catch {
    return false;
  }
}

export function toBase64(bytes: Bytes): string {
  return Buffer.from(bytes).toString('base64');
}

export function fromBase64(value: string): Bytes {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

export function encodeRecord(record: StoredRecord): string {
  return JSON.stringify(record);
}

export function decodeControllerRecord(input: string): CredentialInspection {
  return decodeRecord(input, 'controller');
}

export function decodePairingRecord(input: string): CredentialInspection {
  return decodeRecord(input, 'pairing');
}

function decodeRecord(input: string, kind: 'controller' | 'pairing'): CredentialInspection {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    return { state: 'corrupt', reason: 'invalid-json' };
  }
  if (!isRecord(value)) return { state: 'corrupt', reason: 'invalid-shape' };
  if (value.schemaVersion !== CREDENTIAL_SCHEMA_VERSION) {
    return { state: 'incompatible', version: typeof value.schemaVersion === 'number' ? value.schemaVersion : -1 };
  }
  if (kind === 'controller') {
    if (!isBase64(value.controllerId, { min: 1, max: 64 }) || !isBase64(value.longTermPublicKey, 32) || !isBase64(value.longTermPrivateKey, 64)) {
      return { state: 'corrupt', reason: 'invalid-base64' };
    }
    return { state: 'ready', record: value as unknown as ControllerIdentity };
  }
  if (
    !isBase64(value.accessoryId, { min: 1, max: 64 }) ||
    !isBase64(value.accessoryLongTermPublicKey, 32) ||
    !isBase64(value.controllerId, { min: 1, max: 64 }) ||
    !isBase64(value.controllerLongTermPublicKey, 32) ||
    !isBase64(value.controllerLongTermPrivateKey, 64) ||
    typeof value.pairedAtEpochMs !== 'number' ||
    !Number.isFinite(value.pairedAtEpochMs)
  ) {
    return { state: 'corrupt', reason: 'invalid-base64' };
  }
  return { state: 'ready', record: value as unknown as PairingRecord };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function redactedRecordSummary(record: StoredRecord): { kind: 'controller' | 'pairing'; byteFields: number; schemaVersion: number } {
  return record.schemaVersion === CREDENTIAL_SCHEMA_VERSION && 'accessoryId' in record
    ? { kind: 'pairing', byteFields: 5, schemaVersion: record.schemaVersion }
    : { kind: 'controller', byteFields: 3, schemaVersion: record.schemaVersion };
}
