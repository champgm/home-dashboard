# Ecobee HAP POC — Phase 15 Evidence

## Status

`PARTIAL`: local security/cleanup behavior and evidence hygiene pass; Android backup inspection and physical association restoration are `PENDING TARGET`.

## Sequencing status

`SPECULATIVE IMPLEMENTATION COMPLETE — SEQUENTIAL TARGET VALIDATION PENDING`.

The local security and cleanup implementation was completed before the target-dependent M2 prerequisites were closed. The sanitized audit is deterministic implementation evidence; device backup inspection and association restoration must still be performed sequentially on the target.

## Scope and traceability

- Primary: `SAFE-09`, `PAIR-05`.
- Supporting: `SAFE-01`, `SAFE-02`, `SAFE-04`, `SAFE-10`, `ARC-08`, `ARC-10`, `ARC-14`.
- Acceptance: `HAP-014` is `PENDING TARGET` pending the device backup/data-transfer audit; cleanup behavior is covered deterministically.

## Evidence

- `src/application/pairingCleanup.ts` separates accessory-side controller removal, local credential deletion, and prior-association restoration.
- Removal requires explicit approval, consequence acknowledgement, and a recorded restoration procedure.
- Ambiguous accessory removal retains repair-required state; local deletion is a separate explicit action.
- `spikes/ecobee-hap-poc/docs/SECURITY_AUDIT_CHECKLIST.md` enumerates source, UI, storage, backup, destination, logging, and cleanup checks.
- The evidence scanner and structured logger reject sensitive values and unknown diagnostic fields.

## Verification

```text
test/cleanup/cleanup.test.ts        -> PASS
test/security/audit.test.ts         -> PASS
test/foundation/logger.test.ts      -> PASS
test/foundation/scanner.test.ts     -> PASS
npm --prefix spikes/ecobee-hap-poc run audit:secrets -> PASS
```

No existing HomeKit association was changed in this run, and no restoration claim is made without the actual operator-approved target procedure.
