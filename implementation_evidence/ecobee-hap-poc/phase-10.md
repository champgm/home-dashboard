# Ecobee HAP POC — Phase 10 Evidence

## Status

`PARTIAL`: command validation, capability selection, read-before/read-after confirmation, and ambiguous-write semantics pass deterministic tests; target capability and write evidence are `PENDING TARGET`.

## Sequencing status

`SPECULATIVE IMPLEMENTATION COMPLETE — PREREQUISITES NOT CLOSED`.

This phase's deterministic implementation was completed before the required M1 physical gates were closed. It is not target evidence. Validate it sequentially only after Phases 04–09/M1, then record the target result here; `HAP-008` remains `PENDING TARGET`.

## Scope and traceability

- Primary: `OBJ-08`, `SAFE-06`, `SAFE-07`, `ARC-11`.
- Supporting: `SAFE-05`, `ARC-06`.
- Acceptance: `HAP-008` is `PENDING TARGET`; `HAP-009` is `PASS` for the injected possible-send reconciliation path.

## Evidence

- `src/application/setpointCommand.ts` selects a writable target-temperature or threshold representation from the actual projected capability set.
- Current mode, characteristic format, range, step, unit, and operator-approved occupied-safe range are validated before transmission.
- Every write is explicit, read-before, and read-after. A possible-send result is classified as ambiguous until authoritative read-back resolves it; the service never replays automatically.
- Definite validation and transport failures remain distinct from ambiguous outcomes and reconciliation failures.

## Verification

```text
test/commands/setpoint.test.ts    -> PASS
test/faults/failureMatrix.test.ts -> PASS (possible-send no-replay case)
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

No physical thermostat capability table or safe target write was available, so M2 cannot be advanced from this evidence.
