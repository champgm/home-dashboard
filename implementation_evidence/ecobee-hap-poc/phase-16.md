# Ecobee HAP POC — Phase 16 Evidence

## Status

`BLOCKED`: the WAN-denied reliability run cannot begin because M2 is blocked and no physical target environment is available.

## Sequencing status

`SPECULATIVE IMPLEMENTATION COMPLETE — SEQUENTIAL TARGET VALIDATION BLOCKED`.

The bounded reliability-run harness and procedure were completed before M2 and its WAN-denied prerequisites were closed. No deterministic or desktop result can substitute for the sequential physical run; M3 remains `BLOCKED`.

## Scope and traceability

- Verification: `OBJ-05`, `OBJ-08`–`OBJ-11`, `ARC-06`, `ARC-09`, `ARC-11`, `ARC-12`.
- Supporting acceptance: `HAP-005`, `HAP-007`, `HAP-008`, `HAP-010`, `HAP-011`, `HAP-012`, `HAP-013` remain target-gated.
- Reliability gate: `M3` cannot be decided as pass.

## Evidence

- The implementation contains bounded session closure, retry, observation, read, write, and recovery logic needed by the run.
- The required run is at least eight foreground hours, includes scheduled health reads, safe writes with restoration, interruptions, WAN denial, and resource measurements.
- No mock, emulator, or desktop run has been substituted for that target procedure.

## Verification

```text
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
npm --prefix spikes/ecobee-hap-poc run test:ci   -> PASS
```

Unblock condition: complete the target pairing, M1/M2 evidence, router-denial proof, and the recorded reliability run without restarting the clock after unexplained failures.
