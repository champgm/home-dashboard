# Ecobee HAP POC — Phase 04 Evidence

## Status

`FAIL`: the initial Android Hermes development-build run exposed a runtime incompatibility in the current SRP/Node-crypto path. The required `7 passed · 0 failed` Android vector result was not reached on that gate attempt. Discovery and pairing were not run after this failure. Per the run decision, this observed gate remains recorded as `FAIL`.

## Scope and traceability

- Primary: `ARC-07`.
- Supporting: `SAFE-01`, `ARC-04`.
- Acceptance: `HAP-016` is `FAIL` for the Android crypto/runtime gate.

## Evidence

- `src/hap/crypto/sodiumProvider.ts` retains the deterministic desktop reference for the required hash, HMAC, HKDF, X25519, Ed25519, and AEAD operations through a narrow adapter.
- `src/hap/crypto/quickCryptoProvider.ts` now supplies the Android native primitive path, while the retained SRP adapter is bridged through Metro to quick crypto; no handwritten primitive or insecure fallback is present.
- `src/hap/crypto/vectorManifest.ts` and `src/hap/crypto/vectorRunner.ts` retain deterministic known-answer coverage for the required operations.
- Provider tests cover readiness, exact output, arbitrary HMAC key length, invalid lengths, authentication failure, and vector execution.
- The Android Hermes target run failed at the current `fast-srp-hap` Node-crypto runtime boundary; this is a target-runtime failure, not a deterministic-vector failure.
- Bounded remediation was then implemented: `react-native-quick-crypto@1.1.7`, Metro `crypto`/`node:crypto` mapping, startup installation, native primitive adaptation, and Android Ed25519 raw-private import compatibility.

## Verification

```text
test/crypto/provider.test.ts      -> PASS
test/crypto/vectorRunner.test.ts  -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

```text
Android Hermes development-build vector runner (initial gate) -> FAIL
  Result: current SRP/Node-crypto runtime incompatibility; required 7 passed · 0 failed not reported
  Gate record: FAIL retained as instructed
  Discovery: NOT RUN
  Pairing: NOT RUN
```

```text
Android Hermes development-build vector runner (bounded remediation rerun) -> 7 passed · 0 failed
  App loaded on the Android emulator with the native quick-crypto provider.
  Discovery: NOT RUN
  Pairing: NOT RUN
  Evidence class: remediation result only; it does not rewrite the recorded Phase 04 FAIL.
```

`HAP-016` remains recorded as `FAIL` for this run. A later explicitly accepted
qualification may promote the remediation result; no discovery or pairing is
authorized by this evidence.
