# Ecobee HAP POC — Phase 07 Evidence

## Status

`PARTIAL`: the complete Pair Setup transcript and ownership safety behavior pass a deterministic accessory simulation; approved target pairing is `PENDING TARGET`.

## Scope and traceability

- Primary: `OBJ-03`, `SAFE-05`, `SAFE-08`, `SAFE-10`, `PAIR-02`, `PAIR-03`, `PAIR-04`, `ARC-10`.
- Supporting: `PAIR-01`, `ARC-07`, `ARC-08`.
- Acceptance: `HAP-003` is `PENDING TARGET`; deterministic `HAP-015` support is recorded in Phase 14.

## Evidence

- `src/hap/core/pairSetup/pairingProtocol.ts` implements the Pair Setup M1–M6 flow, exact transcript labels, SRP exchange, proof verification, and encrypted credential derivation through ports.
- Pair Verify support is included so the simulated transcript can prove that the committed record is usable.
- `src/hap/core/pairSetup/pairSetupService.ts` requires an explicit action and ownership preflight, records restoration steps, permits one active operation, avoids automatic retries, stages credentials, and commits only after confirmed completion.
- Existing association handling is explicit. There is no factory reset, HVAC reset, or hidden association-removal action.
- Indeterminate completion marks repair and does not silently promote staged material.

## Verification

```text
test/pairSetup/pairingProtocol.test.ts -> PASS
test/pairVerify/transcript.test.ts    -> PASS (full deterministic setup and verify transcript)
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

The physical target association decision, restoration approval, and post-change local operation check require the actual thermostat and remain pending.
