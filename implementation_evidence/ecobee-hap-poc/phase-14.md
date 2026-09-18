# Ecobee HAP POC — Phase 14 Evidence

## Status

`COMPLETE` for the deterministic negative and failure matrix implemented in the spike.

## Sequencing status

`SPECULATIVE IMPLEMENTATION COMPLETE — SEQUENTIAL TARGET VALIDATION PENDING`.

The negative-path implementation was completed before the physical M2 prerequisites were closed. Its deterministic result is limited to the injected matrix; validate target-specific rejection behavior only after the preceding target gates.

## Scope and traceability

- Verification: `SAFE-07`, `SAFE-08`, `ARC-06`, `ARC-08`, `ARC-09`, `ARC-10`, `ARC-11`.
- Acceptance: `HAP-015` is `PASS` for the deterministic failure paths exercised here; a target-specific accessory rejection remains outside this run.

## Evidence

- Public, loopback, unspecified, and off-interface endpoints are rejected before connection.
- Missing, corrupt, partial, and unknown-version protected records remain repair-required and are not silently replaced.
- Malformed and out-of-order pairing messages fail explicitly without a retry loop.
- An interrupted possible-send write is ambiguous, is reconciled by read-back, and is never replayed automatically.
- Pair Verify rejection preserves the durable record while surfacing repair-required state.
- Ambiguous accessory-controller removal remains distinct from local credential deletion.

## Verification

```text
test/faults/failureMatrix.test.ts       -> PASS
test/pairSetup/pairingProtocol.test.ts  -> PASS
test/pairVerify/service.test.ts         -> PASS
test/cleanup/cleanup.test.ts            -> PASS
npm --prefix spikes/ecobee-hap-poc run test:ci -> PASS
```

The remaining target-specific negative observation, if needed for the representative thermostat, is recorded as a follow-up rather than being invented from a fake.
