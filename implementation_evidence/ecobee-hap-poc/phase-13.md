# Ecobee HAP POC — Phase 13 Evidence

## Status

`BLOCKED` for the milestone decision: the required physical thermostat, Android phone, and independently verifiable WAN-denial setup were unavailable.

## Sequencing status

`SPECULATIVE IMPLEMENTATION COMPLETE — SEQUENTIAL TARGET VALIDATION BLOCKED`.

The local-only implementation path was completed before M1 and the preceding M2 prerequisites were closed. It must be validated in order after the target discovery, pairing, reads, writes, and recovery gates; no WAN-denied target result is claimed here.

## Scope and traceability

- Primary: `OBJ-11`.
- Supporting: `SAFE-03`, `ARC-13`.
- Acceptance: `HAP-012` and `HAP-013` are `PENDING TARGET`.
- Milestone: M2 is `BLOCKED`; owner is the POC operator, and the unblock condition is a physical target run with router/firewall evidence.

## Evidence

- The implementation path is local-only by construction: discovery resolves a local HAP endpoint, transport connects only to that selected endpoint, and no cloud client or bridge dependency exists in the spike.
- The cold-start operation sequence is represented by the lifecycle and Pair Verify services, but it was not exercised against a target with WAN access independently denied.
- The run procedure and required independent denial proof are recorded in the acceptance document and are not replaced by an application-level assumption.

## Verification

```text
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
npm --prefix spikes/ecobee-hap-poc run test:ci   -> PASS
```

No M2 pass is claimed. A desktop simulation or code audit cannot prove target WAN independence.
