# Ecobee HAP POC — Phase 11 Evidence

## Status

`PARTIAL`: event subscription and bounded polling behavior are implemented and measured in deterministic tests; target event reliability measurement is `PENDING TARGET`.

## Sequencing status

`SPECULATIVE IMPLEMENTATION COMPLETE — PREREQUISITES NOT CLOSED`.

This phase's implementation was completed before M1 and the target-validation result for Phase 10 were closed. Deterministic behavior is not target evidence. Validate sequentially after the preceding gates and record the target event-versus-polling result here; `HAP-010` remains `PENDING TARGET`.

## Scope and traceability

- Primary: `OBJ-09`, `ARC-12`.
- Supporting: `ARC-09`, `ARC-11`.
- Acceptance: `HAP-010` is `PENDING TARGET` for the target measurement and final event-versus-polling decision.

## Evidence

- `src/hap/core/events/observation.ts` subscribes only to event-capable characteristics.
- `src/hap/transport/eventTransport.ts` maps protected HAP event messages to the observation port and rejects partial subscription responses.
- If subscription is rejected or unreliable, the fallback scheduler polls only while foregrounded, never overlaps requests, uses a bounded 30-second cadence, and stops after five minutes unless renewed by the lifecycle owner.
- Background transitions stop observation; generation changes discard stale event results.
- `spikes/ecobee-hap-poc/docs/OBSERVATION_POLICY.md` records the production-candidate policy: prefer events when accepted and use bounded foreground polling otherwise.

## Verification

```text
test/events/events.test.ts         -> PASS
test/observation/scheduler.test.ts -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

The target must provide the observed event behavior, staleness, and traffic measurements before the policy can be closed.
