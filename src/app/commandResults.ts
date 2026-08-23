import { CommandResult, Diagnostic } from "./types";

export function success<T>(value?: T): CommandResult<T> {
  return { kind: "success", value };
}

export function definiteFailure<T = never>(diagnostic: Diagnostic): CommandResult<T> {
  return { kind: "definite_failure", diagnostic };
}

export function ambiguous<T = never>(diagnostic: Diagnostic): CommandResult<T> {
  return { kind: "ambiguous", diagnostic };
}

export function partialFailure<T = never>(diagnostic: Diagnostic): CommandResult<T> {
  return { kind: "partial_failure", diagnostic };
}

export function abandoned<T = never>(diagnostic: Diagnostic): CommandResult<T> {
  return { kind: "abandoned", diagnostic };
}
