# Phase 04 — HAP Cryptographic Primitive Qualification

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `spikes/ecobee-hap-poc/docs/HAP_SOURCE_DECISION.md`
- `implementation_evidence/ecobee-hap-poc/phase-03.md`

**Prerequisites:** Phases 01–03 and accepted provider choices from Phase 02.

## Current gate disposition

`HAP-016`: `FAIL` for the initial qualification attempt. The Android Hermes
development-build run exposed the current `fast-srp-hap` Node-crypto runtime
incompatibility; the required `7 passed · 0 failed` result was not reached on
that gate attempt. Discovery and pairing are not authorized from this failure.
The bounded remediation has been implemented with the documented
`react-native-quick-crypto` bridge, explicit Metro `crypto`/`node:crypto`
mapping, startup installation, native primitive adaptation, and the Android
Ed25519 raw-private import compatibility fix. Its emulator rerun reports
`7 passed · 0 failed`, but the observed Phase 04 gate remains recorded as
`FAIL` pending explicit qualification acceptance.

## Objective

Provide a narrow crypto adapter whose exact HAP-required operations pass retained known-answer/upstream vectors in Jest/Hermes and an Android development build.

## Why this phase exists

Pair Setup and Pair Verify are unsafe to debug as undifferentiated handshakes. Qualifying each primitive and byte encoding first isolates provider/runtime incompatibility.

## Authoritative requirements

- PRIMARY: `ARC-07`
- Supporting: `SAFE-01`, `ARC-04`

## Relevant design sections

- `Crypto adapter`
- `HAP controller core`
- `Logging and evidence`

## In scope

- Install only Phase 02-approved crypto dependencies in the spike.
- Implement secure random, hash/HMAC/HKDF, SRP operations, Curve25519 agreement, Ed25519 signing/verification, and exact ChaCha20-Poly1305 modes required by the selected HAP source.
- Normalize bytes/endianness without implicit strings or platform-dependent Buffer behavior.
- Retain vector provenance and add an on-device vector runner with sanitized pass/fail output.
- Fail closed when a primitive/provider is missing; no algorithm fallback.

## Explicitly out of scope

- Pair Setup/Verify state machines, TCP, credentials, benchmarking as a product SLA

## Expected repository changes

Existing prerequisites: spike foundation, provider decision, credential randomness port.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/crypto/`
- `spikes/ecobee-hap-poc/test/crypto/`, `test/vectors/`
- device-only vector-runner screen or development action
- spike package/lock/native configuration updates
- `implementation_evidence/ecobee-hap-poc/phase-04.md`

## Required implementation behavior

- Use CSPRNG only; deterministic random exists only behind test injection.
- Verify exact key lengths, nonce construction, tags, transcript bytes, and authentication failure behavior.
- Zero-length, malformed-length, altered-tag/signature, and wrong-key inputs fail explicitly.
- Test vectors contain no household credentials.

## Tests

- Known-answer vectors for every primitive and composed derivation available upstream.
- Negative authentication/signature/vector mutation cases.
- Hermes physical-device execution of the same vector manifest; the initial
  Android result is recorded as `FAIL`, with the bounded remediation rerun
  separately recorded as `7 passed · 0 failed`.
- Sanitized diagnostic assertions for provider/unavailable/authentication errors.

## Acceptance focus

- PRIMARY: `HAP-016`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/crypto test/vectors
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-04.md`; record provider versions, vector provenance/results, device build/result, and any `PENDING TARGET` or `FAIL` command/result.

## Exit criteria

- [ ] Every required primitive has a narrow adapter and passing negative/vector tests.
- [x] The bounded Android emulator rerun reports `7 passed · 0 failed`; retain the observed initial `FAIL` classification and remediation evidence until explicit qualification acceptance.
- [ ] No hand-written primitive or silent fallback exists.
- [ ] `HAP-016` is honestly classified and evidence is complete.
