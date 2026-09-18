# Phase 15 — Security Audit and Pairing Cleanup/Restoration

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-14.md`

**Prerequisites:** M2 decided and Phase 14 failure semantics complete.

## Objective

Complete the source/build/runtime security and privacy audit, then prove explicit operator-controlled accessory unpairing, local credential deletion, and any approved prior-association restoration as distinct safe operations.

## Why this phase exists

Security inspection and pairing cleanup share sensitive credential/ownership surfaces but no longer carry the full fault-injection matrix. They form a bounded destructive-adjacent review before the reliability run.

## Authoritative requirements

- PRIMARY: `SAFE-09`, `PAIR-05`
- Supporting: `SAFE-01`, `SAFE-02`, `SAFE-04`, `SAFE-10`, `ARC-08`, `ARC-10`, `ARC-14`

## Relevant design sections

- `Credential store adapter`
- `Pairing flow` cleanup paragraph
- `Logging and evidence`
- acceptance `Security and privacy checks`

## In scope

- Run source/build/log/fixture/evidence secret scanner and manual redaction audit.
- Inspect Android backup/data-transfer configuration, permissions, release-like logging, and dependency/native surfaces.
- Verify no arbitrary endpoint, raw request, or arbitrary characteristic-writing facility exists.
- Implement explicit consequence UI and safe ordering for accessory-side unpair and local credential deletion.
- Preserve a repair-required record after ambiguous/failed accessory removal; delete locally only through separate confirmation.
- With explicit approval, remove the POC controller and restore a displaced Apple Home association without factory reset or HVAC configuration changes.

## Explicitly out of scope

- Automatic repair/reset, production migration, generalized controller administration, repeated fault-matrix implementation, new thermostat features

## Expected repository changes

Existing prerequisites: known cleanup failure semantics and complete POC flows.

Expected outputs:

- cleanup code under `spikes/ecobee-hap-poc/src/application/pairing/`
- `spikes/ecobee-hap-poc/test/security/`, `test/cleanup/`
- sanitized audit artifacts under `implementation_evidence/ecobee-hap-poc/`
- `implementation_evidence/ecobee-hap-poc/phase-15.md`

## Required implementation behavior

- Accessory removal, local deletion, and prior-association restoration are separate visible states/actions.
- Consequences appear before explicit confirmation; cancellation changes nothing.
- Ambiguous accessory removal retains credentials/repair evidence and does not claim success.
- Restoration follows the approved procedure and never factory-resets or changes HVAC equipment configuration.
- Audit artifacts contain no real secrets or stable household identifiers.

## Tests

- Cleanup state/ordering tests for cancel, success, explicit failure, ambiguous failure, and store deletion failure.
- Secret scanner plus manual source/UI/log/fixture/evidence inspection.
- Android backup/config/permission and release-like logging inspection.
- Raw-surface and invalid-destination inspection.
- Approved target unpair/local delete/restoration procedure, or explicit `PENDING TARGET`/`BLOCKED` status.

## Acceptance focus

- PRIMARY: `HAP-014`; supporting `HAP-003`, `HAP-015`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/security test/cleanup test/credentials
npm --prefix spikes/ecobee-hap-poc run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-15.md`; record scanner/manual audit, backup/permission/logging inspection, cleanup state results, approved target procedure, restoration outcome, and pending work.

## Exit criteria

- [ ] Secret/privacy/backup/permission/logging/raw-surface audits pass.
- [ ] Cleanup operations and consequences are distinct and tested.
- [ ] Approved target cleanup/restoration passes or is explicitly pending/blocked.
- [ ] `HAP-014` is honestly classified and evidence is complete.
- [ ] No automatic reset/repair or new feature was introduced.
