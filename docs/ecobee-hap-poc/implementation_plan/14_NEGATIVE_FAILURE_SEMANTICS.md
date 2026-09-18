# Phase 14 — Negative and Failure Semantics

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-13.md`

**Prerequisite:** M2 decided in Phase 13.

## Objective

Prove required invalid-input, rejected-operation, stale-endpoint, credential-corruption, and interrupted-protocol paths terminate in explicit safe states with useful non-sensitive diagnostics and no uncontrolled retry or deletion.

## Why this phase exists

Fault injection across established adapters is a substantial reasoning set independent of destructive pairing cleanup. This phase closes failure semantics first; Phase 15 then audits security and exercises operator-controlled cleanup against known states.

## Authoritative requirements

- No new PRIMARY implementation IDs; verifies `SAFE-07`, `SAFE-08`, `ARC-06`, `ARC-08`, `ARC-09`, `ARC-10`, `ARC-11`

## Relevant design sections

- `Credential store adapter`
- `Connection and state model`
- `Pairing flow`
- `Normal session and commands`
- acceptance `Resilience matrix`

## In scope

- Complete missing/corrupt/partial/incompatible credential cases.
- Exercise wrong setup code in controlled fixture/test, accessory busy/rejection/removal, and invalid/out-of-order Pair Setup/Verify messages.
- Exercise stale/public/loopback/unspecified/unrelated endpoints and identity mismatch.
- Inject connect/read/write timeout, malformed/truncated/oversize data, authentication failure, stale callbacks, concurrent operation, and possible-send command failure.
- Verify bounded termination, preserved repair evidence, no automatic Pair Setup/write retry, no credential deletion loop, and useful redacted diagnostics.
- Complete the acceptance negative-test table without performing accessory-side unpair or local deletion.

## Explicitly out of scope

- Accessory-side unpairing, local credential deletion, prior-association restoration, broad security/privacy audit, automatic repair/reset, new features

## Expected repository changes

Existing prerequisites: complete POC flows and pairing/restoration record.

Expected outputs:

- narrow fixes in owning modules only where a tested failure semantic is missing
- `spikes/ecobee-hap-poc/test/faults/`
- `implementation_evidence/ecobee-hap-poc/phase-14.md`

## Required implementation behavior

- Every injected fault has a defined terminal/recoverable/repair-required/ambiguous result.
- Possible-send commands remain ambiguous and are never replayed.
- Authentication/protocol failure closes session-only state without deleting durable pairing data.
- Pair Setup errors do not loop or trigger reset.
- Fault artifacts and diagnostics contain no raw bytes, secrets, or stable household identifiers.

## Tests

- Full HAP-015 negative matrix across credentials, discovery, wire, pairing, session, read/write, observation, and recovery.
- Boundary-fault cases at before-send/possible-send/after-response points.
- No-retry/no-delete assertions and stale-generation/concurrency tests.
- Diagnostic allowlist/redaction assertions for every error category.

## Acceptance focus

- PRIMARY: `HAP-015`; supporting `HAP-003`, `HAP-009`, `HAP-011`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/faults test/credentials test/pairSetup test/recovery
npm --prefix spikes/ecobee-hap-poc run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-14.md`; include the complete negative matrix, injected boundary, expected/actual result, diagnostic category, retry/delete observation, and any target-dependent negative check.

## Exit criteria

- [ ] HAP-015 negative cases produce explicit safe states and diagnostics.
- [ ] No automatic retry, credential deletion loop, or stale publication occurs.
- [ ] Fault evidence is sanitized and target-dependent cases are explicit.
- [ ] `HAP-015` is honestly classified and evidence is complete.
- [ ] Cleanup/security work remains for Phase 15.

