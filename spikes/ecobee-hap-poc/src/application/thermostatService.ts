import type { Clock, HapSessionApi, SafeLogger } from '../hap/ports/contracts';
import { parseAccessoryDatabase, parseCharacteristicReadResponse } from '../hap/core/accessories/enumeration';
import { applyCharacteristicReads, projectThermostat } from '../hap/core/accessories/thermostatProjection';
import type { ThermostatProjection } from '../hap/core/accessories/models';

export class ThermostatRefreshError extends Error {
  constructor(readonly category: string) {
    super(category);
    this.name = 'ThermostatRefreshError';
  }
}

export class ThermostatReadService {
  constructor(private readonly clock: Clock, private readonly logger?: SafeLogger) {}

  async refresh(session: HapSessionApi): Promise<ThermostatProjection> {
    let databaseResponse;
    try {
      databaseResponse = await session.request('GET', '/accessories');
    } catch {
      throw new ThermostatRefreshError('accessories-request-failed');
    }
    if (databaseResponse.statusCode !== 200) throw new ThermostatRefreshError('accessories-http-error');
    let databaseJson: unknown;
    try {
      databaseJson = parseJson(databaseResponse.body, databaseResponse.headers, 'accessories');
    } catch (error) {
      this.logger?.error('thermostat.response-invalid', {
        operation: 'thermostat-read', result: 'failure',
        errorCategory: error instanceof ThermostatRefreshError ? error.category : 'accessories-parse-failed',
        generation: session.generation,
        detail: describeResponseShape(databaseResponse.body, databaseResponse.headers)
      });
      throw error;
    }
    let projection: ThermostatProjection;
    try {
      projection = projectThermostat(parseAccessoryDatabase(databaseJson));
    } catch (error) {
      const category = error instanceof Error && error.message === 'thermostat service is not exposed by target'
        ? 'thermostat-service-missing'
        : 'accessories-schema-unsupported';
      throw new ThermostatRefreshError(category);
    }
    const readable = projection.capabilities.filter((capability) => capability.status === 'available' && capability.characteristic.iid > 0 && capability.characteristic.perms.includes('pr'));
    if (readable.length === 0) throw new ThermostatRefreshError('thermostat-readable-capability-missing');
    const ids = readable.map((capability) => `${capability.characteristic.aid}.${capability.characteristic.iid}`).join(',');
    // The accessory database is authoritative for metadata. Some Ecobee firmware
    // emits malformed JSON when optional read-response metadata is requested, so
    // keep the live read to the values/status fields that this service consumes.
    const path = `/characteristics?id=${ids}`;
    let response;
    try {
      response = await session.request('GET', path);
    } catch {
      throw new ThermostatRefreshError('characteristics-request-failed');
    }
    if (response.statusCode !== 200 && response.statusCode !== 207) throw new ThermostatRefreshError('characteristics-http-error');
    let readJson: unknown;
    try {
      readJson = parseJson(response.body, response.headers, 'characteristics');
    } catch (error) {
      this.logger?.error('thermostat.response-invalid', {
        operation: 'thermostat-read', result: 'failure',
        errorCategory: error instanceof ThermostatRefreshError ? error.category : 'characteristics-parse-failed',
        generation: session.generation,
        detail: describeResponseShape(response.body, response.headers)
      });
      throw error;
    }
    let reads;
    try {
      reads = parseCharacteristicReadResponse(readJson);
    } catch {
      throw new ThermostatRefreshError('characteristics-schema-unsupported');
    }
    const next = applyCharacteristicReads(projection, reads, 'initial-read', session.generation, this.clock.now());
    this.logger?.event('thermostat.read-refresh', { operation: 'thermostat-read', result: 'success', generation: session.generation });
    return next;
  }
}

function parseJson(body: Uint8Array, headers: Readonly<Record<string, string>>, stage: 'accessories' | 'characteristics'): unknown {
  if (body.length === 0) throw new ThermostatRefreshError(`${stage}-body-empty`);
  const contentEncoding = headers['content-encoding']?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') throw new ThermostatRefreshError(`${stage}-content-encoding-unsupported`);
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(body);
  } catch {
    throw new ThermostatRefreshError(`${stage}-utf8-invalid`);
  }
  const trimmed = text.trim().replace(/\0+$/g, '');
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    throw new ThermostatRefreshError(`${stage}-json-framing-invalid`);
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new ThermostatRefreshError(`${stage}-json-${classifyJsonDeviation(trimmed)}`);
  }
}

function classifyJsonDeviation(value: string): string {
  let inString = false;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const character = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === '\\') {
        escaped = true;
        continue;
      }
      if (character === '"') inString = false;
      else if (code < 0x20) return 'unescaped-string-control';
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === ',') {
      let next = index + 1;
      while (next < value.length && /\s/.test(value[next])) next += 1;
      if (value[next] === '}' || value[next] === ']') return 'trailing-comma';
    }
    if (/[A-Za-z]/.test(character)) {
      let end = index + 1;
      while (end < value.length && /[A-Za-z]/.test(value[end])) end += 1;
      const token = value.slice(index, end).toLowerCase();
      if (!['true', 'false', 'null'].includes(token)) {
        if (token === 'nan') return 'nonfinite-nan';
        if (token === 'inf' || token === 'infinity') return 'nonfinite-infinity';
        return 'unexpected-token';
      }
      index = end - 1;
    }
  }
  if (inString) return 'unterminated-string';
  return diagnoseJsonStructure(value);
}

function diagnoseJsonStructure(value: string): string {
  let index = 0;
  const fail = (category: string): never => { throw new JsonStructureError(category); };
  const whitespace = () => { while (index < value.length && /\s/.test(value[index])) index += 1; };
  const string = () => {
    if (value[index] !== '"') fail('string-expected');
    index += 1;
    while (index < value.length) {
      const character = value[index++];
      if (character === '"') return;
      if (character.charCodeAt(0) < 0x20) fail('unescaped-string-control');
      if (character !== '\\') continue;
      if (index >= value.length) fail('unterminated-escape');
      const escape = value[index++];
      if ('"\\/bfnrt'.includes(escape)) continue;
      if (escape !== 'u') fail('invalid-escape');
      if (!/^[0-9a-fA-F]{4}$/.test(value.slice(index, index + 4))) fail('invalid-unicode-escape');
      index += 4;
    }
    fail('unterminated-string');
  };
  const number = () => {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(value.slice(index));
    if (!match) throw new JsonStructureError('invalid-number');
    index += match[0].length;
    if (index < value.length && /[0-9.eE+-]/.test(value[index])) fail('invalid-number');
  };
  const parseValue = (depth: number): void => {
    if (depth > 128) fail('nesting-too-deep');
    whitespace();
    const character = value[index];
    if (character === '"') { string(); return; }
    if (character === '{') {
      index += 1;
      whitespace();
      if (value[index] === '}') { index += 1; return; }
      while (index < value.length) {
        if (value[index] !== '"') fail('object-key-not-string');
        string();
        whitespace();
        if (value[index] !== ':') fail('object-colon-missing');
        index += 1;
        parseValue(depth + 1);
        whitespace();
        if (value[index] === '}') { index += 1; return; }
        if (value[index] !== ',') fail(`object-separator-before-${classifySyntaxCharacter(value[index])}-at-${index}-context-${classifySyntaxWindow(value, index)}`);
        index += 1;
        whitespace();
        if (value[index] === '}') fail('trailing-comma');
      }
      fail('object-unterminated');
    }
    if (character === '[') {
      index += 1;
      whitespace();
      if (value[index] === ']') { index += 1; return; }
      while (index < value.length) {
        parseValue(depth + 1);
        whitespace();
        if (value[index] === ']') { index += 1; return; }
        if (value[index] !== ',') fail(`array-separator-before-${classifySyntaxCharacter(value[index])}-at-${index}-context-${classifySyntaxWindow(value, index)}`);
        index += 1;
        whitespace();
        if (value[index] === ']') fail('trailing-comma');
      }
      fail('array-unterminated');
    }
    if (character === '-' || /[0-9]/.test(character ?? '')) { number(); return; }
    for (const literal of ['true', 'false', 'null']) {
      if (value.startsWith(literal, index)) { index += literal.length; return; }
    }
    fail(index >= value.length ? 'value-missing' : 'invalid-literal');
  };
  try {
    parseValue(0);
    whitespace();
    return index === value.length ? 'parser-disagreement' : 'trailing-data';
  } catch (error) {
    return error instanceof JsonStructureError ? error.category : 'syntax-other';
  }
}

class JsonStructureError extends Error {
  constructor(readonly category: string) { super(category); }
}

function classifySyntaxCharacter(character: string | undefined): string {
  if (character === undefined) return 'end';
  if (character === '{') return 'object';
  if (character === '}') return 'object-end';
  if (character === '[') return 'array';
  if (character === ']') return 'array-end';
  if (character === '"') return 'string';
  if (character === ':') return 'colon';
  if (character === '.' || character === '-' || /[0-9]/.test(character)) return 'number';
  if (/[A-Za-z]/.test(character)) return 'literal';
  return 'other';
}

function classifySyntaxWindow(value: string, center: number): string {
  const start = Math.max(0, center - 12);
  const end = Math.min(value.length, center + 13);
  let result = '';
  for (let index = start; index < end; index += 1) {
    const character = value[index];
    if (character === '"') result += 'q';
    else if (/[A-Za-z]/.test(character)) result += 'a';
    else if (/[0-9]/.test(character)) result += 'n';
    else if (/\s/.test(character)) result += '_';
    else if ('{}[],:.-+\\'.includes(character)) result += character;
    else result += 'x';
  }
  return result;
}

function describeResponseShape(body: Uint8Array, headers: Readonly<Record<string, string>>): string {
  const declared = headers['content-length'];
  const transfer = headers['transfer-encoding']?.toLowerCase();
  const first = body.length > 0 ? classifyBoundaryByte(body[0]) : 'none';
  const last = body.length > 0 ? classifyBoundaryByte(body[body.length - 1]) : 'none';
  const nulCount = body.reduce((count, value) => count + Number(value === 0), 0);
  return `bytes-${body.length}_declared-${declared && /^\d+$/.test(declared) ? declared : 'none'}_transfer-${transfer === 'chunked' ? 'chunked' : transfer ? 'other' : 'none'}_first-${first}_last-${last}_nul-${nulCount}`;
}

function classifyBoundaryByte(value: number): string {
  if (value === 0x7b) return 'object';
  if (value === 0x5b) return 'array';
  if (value === 0x7d) return 'object-end';
  if (value === 0x5d) return 'array-end';
  if (value === 0) return 'nul';
  if ([9, 10, 13, 32].includes(value)) return 'whitespace';
  return 'other';
}
