# Ecobee HAP POC — Phase 12 Evidence

## Status

`PARTIAL`: lifecycle ordering, cancellation, backoff, and stale-generation handling pass deterministic tests; the physical interruption matrix is `PENDING TARGET`.

## Sequencing status

`SPECULATIVE IMPLEMENTATION COMPLETE — PREREQUISITES NOT CLOSED`.

This phase's recovery implementation was completed before M1 and the preceding target gates were closed. Fakes and deterministic interruption tests do not substitute for sequential target validation; the physical matrix remains `PENDING TARGET`.

## Scope and traceability

- Primary: `OBJ-10`.
- Supporting: `ARC-05`, `ARC-09`, `ARC-12`, `SAFE-07`.
- Acceptance: `HAP-011` is `PENDING TARGET`.

## Evidence

- `src/application/lifecycleCoordinator.ts` owns the recovery order: resolve paired endpoint, load credentials, Pair Verify, enumerate/refresh, then restore observation.
- Lifecycle epochs and cancellation prevent backgrounded or stale work from publishing state.
- `src/hap/session/sessionCoordinator.ts` bounds reconnect attempts and keeps stale socket close events from affecting the current session.
- Recovery never falls back to Pair Setup and does not delete durable credentials for an ordinary transport interruption.
- The UI composition delegates foreground/background recovery to this lifecycle coordinator and resolves the paired accessory identity before choosing its current endpoint.

## Verification

```text
test/lifecycle/coordinator.test.ts -> PASS
test/recovery/generation.test.ts   -> PASS
test/observation/scheduler.test.ts -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

Phone Wi-Fi reconnect, access-point change, thermostat restart, TCP refusal, and address change still require the physical target matrix.
