export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type FailureCode =
  | 'cancelled'
  | 'timeout'
  | 'invalid_input'
  | 'unsupported'
  | 'unavailable'
  | 'authentication_failed'
  | 'protocol_error'
  | 'transport_error'
  | 'possible_send'
  | 'ambiguous'
  | 'repair_required'
  | 'storage_error'
  | 'stale_generation';

export interface OperationFailure {
  readonly code: FailureCode;
  readonly category: string;
  readonly retryable: boolean;
  readonly repairRequired: boolean;
  readonly possibleSend: boolean;
}

export function failure(
  code: FailureCode,
  category: string,
  options: Partial<Omit<OperationFailure, 'code' | 'category'>> = {}
): OperationFailure {
  return {
    code,
    category,
    retryable: options.retryable ?? false,
    repairRequired: options.repairRequired ?? false,
    possibleSend: options.possibleSend ?? false
  };
}
