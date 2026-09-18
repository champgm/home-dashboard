import type { HapSessionApi, SafeLogger } from '../hap/ports/contracts';
import { err, failure, ok, type Result } from './result';
import { HapCharacteristicType, type CharacteristicMetadata, type ProjectedCapability, type ThermostatProjection } from '../hap/core/accessories/models';
import { parseCharacteristicReadResponse } from '../hap/core/accessories/enumeration';
import { validateCharacteristicValue } from '../hap/core/accessories/thermostatProjection';

export interface OccupiedSafeTemperatureRange {
  readonly min: number;
  readonly max: number;
  readonly unit: 'celsius' | 'fahrenheit';
}

export type SetpointStatus = 'confirmed' | 'definite-failure' | 'ambiguous' | 'unsupported' | 'reconciliation-failure';

export interface SetpointCommandResult {
  readonly status: SetpointStatus;
  readonly selected?: { readonly aid: number; readonly iid: number; readonly type: string };
  readonly before?: number;
  readonly intended?: number;
  readonly after?: number;
  readonly reconciledFromPossibleSend: boolean;
  readonly automaticReplay: false;
  readonly errorCategory?: string;
}

export interface SetpointWriter {
  write(session: HapSessionApi, characteristic: CharacteristicMetadata, value: number): Promise<{ readonly kind: 'accepted' | 'rejected' | 'possible-send'; readonly errorCategory?: string }>;
  read(session: HapSessionApi, characteristic: CharacteristicMetadata): Promise<{ readonly kind: 'value' | 'failure'; readonly value?: number; readonly errorCategory?: string }>;
}

export class HapSetpointWriter implements SetpointWriter {
  async write(session: HapSessionApi, characteristic: CharacteristicMetadata, value: number): Promise<{ kind: 'accepted' | 'rejected' | 'possible-send'; errorCategory?: string }> {
    const body = new TextEncoder().encode(JSON.stringify({ characteristics: [{ aid: characteristic.aid, iid: characteristic.iid, value }] }));
    try {
      const response = await session.request('PUT', '/characteristics', body, 'application/hap+json');
      if (response.statusCode === 204) return { kind: 'accepted' };
      if (response.statusCode === 207) {
        const parsed = parseCharacteristicReadResponse(JSON.parse(new TextDecoder().decode(response.body)));
        const result = parsed.characteristics.find((item) => item.aid === characteristic.aid && item.iid === characteristic.iid);
        return result && (result.status === undefined || result.status === 0) ? { kind: 'accepted' } : { kind: 'rejected', errorCategory: result ? `hap-status-${result.status}` : 'write-result-missing' };
      }
      return { kind: 'rejected', errorCategory: `http-status-${response.statusCode}` };
    } catch {
      return { kind: 'possible-send', errorCategory: 'write-transport-uncertain' };
    }
  }

  async read(session: HapSessionApi, characteristic: CharacteristicMetadata): Promise<{ kind: 'value' | 'failure'; value?: number; errorCategory?: string }> {
    try {
      const response = await session.request('GET', `/characteristics?id=${characteristic.aid}.${characteristic.iid}`);
      if (response.statusCode !== 200 && response.statusCode !== 207) return { kind: 'failure', errorCategory: `http-status-${response.statusCode}` };
      const read = parseCharacteristicReadResponse(JSON.parse(new TextDecoder().decode(response.body))).characteristics[0];
      if (!read || read.status !== undefined && read.status !== 0 || typeof read.value !== 'number') return { kind: 'failure', errorCategory: 'readback-invalid' };
      return { kind: 'value', value: read.value };
    } catch {
      return { kind: 'failure', errorCategory: 'readback-failed' };
    }
  }
}

export function selectWritableSetpoint(projection: ThermostatProjection, currentMode: number | undefined): Result<CharacteristicMetadata, ReturnType<typeof failure>> {
  const target = availableWritable(projection, HapCharacteristicType.targetTemperature);
  if (target) return ok(target);
  if (currentMode === 1) {
    const heat = availableWritable(projection, HapCharacteristicType.heatingThresholdTemperature);
    if (heat) return ok(heat);
  }
  if (currentMode === 2) {
    const cool = availableWritable(projection, HapCharacteristicType.coolingThresholdTemperature);
    if (cool) return ok(cool);
  }
  return err(failure('unsupported', currentMode === 3 ? 'auto-mode-needs-target-temperature' : 'no-writable-setpoint'));
}

export function validateSetpoint(characteristic: CharacteristicMetadata, value: number, safeRange: OccupiedSafeTemperatureRange): Result<void, ReturnType<typeof failure>> {
  if (!Number.isFinite(value)) return err(failure('invalid_input', 'setpoint-not-finite'));
  if (safeRange.min > safeRange.max) return err(failure('invalid_input', 'safe-range-invalid'));
  if (value < safeRange.min || value > safeRange.max) return err(failure('invalid_input', 'setpoint-outside-occupied-safe-range'));
  const metadata = validateCharacteristicValue(characteristic, value);
  if (!metadata.ok) return err(failure('invalid_input', `setpoint-${metadata.error}`));
  if (typeof metadata.value !== 'number') return err(failure('invalid_input', 'setpoint-not-numeric'));
  return ok(undefined);
}

export class SetpointCommandService {
  constructor(private readonly writer: SetpointWriter = new HapSetpointWriter(), private readonly logger?: SafeLogger) {}

  async execute(
    session: HapSessionApi,
    projection: ThermostatProjection,
    intended: number,
    safeRange: OccupiedSafeTemperatureRange,
    confirmedByOperator: boolean,
    currentMode?: number
  ): Promise<Result<SetpointCommandResult, ReturnType<typeof failure>>> {
    const selected = selectWritableSetpoint(projection, currentMode);
    if (!selected.ok) return ok({ status: 'unsupported', reconciledFromPossibleSend: false, automaticReplay: false, errorCategory: selected.error.category });
    const characteristic = selected.value;
    if (!confirmedByOperator) return err(failure('invalid_input', 'setpoint-confirmation-required'));
    const validation = validateSetpoint(characteristic, intended, safeRange);
    if (!validation.ok) return ok({ status: 'definite-failure', selected: identity(characteristic), intended, reconciledFromPossibleSend: false, automaticReplay: false, errorCategory: validation.error.category });
    const beforeRead = await this.writer.read(session, characteristic);
    if (beforeRead.kind !== 'value' || beforeRead.value === undefined) return ok({ status: 'definite-failure', selected: identity(characteristic), intended, reconciledFromPossibleSend: false, automaticReplay: false, errorCategory: beforeRead.errorCategory ?? 'before-read-failed' });
    const write = await this.writer.write(session, characteristic, intended);
    if (write.kind === 'rejected') return ok({ status: 'definite-failure', selected: identity(characteristic), before: beforeRead.value, intended, reconciledFromPossibleSend: false, automaticReplay: false, errorCategory: write.errorCategory });
    const afterRead = await this.writer.read(session, characteristic);
    if (afterRead.kind !== 'value' || afterRead.value === undefined) {
      return ok({ status: write.kind === 'possible-send' ? 'ambiguous' : 'reconciliation-failure', selected: identity(characteristic), before: beforeRead.value, intended, reconciledFromPossibleSend: write.kind === 'possible-send', automaticReplay: false, errorCategory: afterRead.errorCategory ?? 'readback-failed' });
    }
    const matches = Math.abs(afterRead.value - intended) < 1e-6;
    const result: SetpointCommandResult = {
      status: matches ? 'confirmed' : write.kind === 'possible-send' ? 'ambiguous' : 'reconciliation-failure',
      selected: identity(characteristic), before: beforeRead.value, intended, after: afterRead.value,
      reconciledFromPossibleSend: write.kind === 'possible-send', automaticReplay: false,
      errorCategory: matches ? undefined : 'readback-mismatch'
    };
    this.logger?.event('thermostat.setpoint-result', { operation: 'setpoint-write', result: matches ? 'success' : write.kind === 'possible-send' ? 'ambiguous' : 'failure', generation: session.generation });
    return ok(result);
  }
}

function availableWritable(projection: ThermostatProjection, type: string): CharacteristicMetadata | undefined {
  return projection.capabilities.find((capability: ProjectedCapability) => capability.status === 'available' && capability.characteristic.type === type && capability.characteristic.perms.includes('pw'))?.characteristic;
}

function identity(characteristic: CharacteristicMetadata): { aid: number; iid: number; type: string } {
  return { aid: characteristic.aid, iid: characteristic.iid, type: characteristic.type };
}
