# Ecobee HAP POC — Phase 05 Evidence

## Status

`PARTIAL`: parser, policy, and coordinator behavior pass deterministic tests; live Android DNS-SD discovery is recorded as `PASS` for HAP-001, while HAP-002 and association inspection remain `PENDING TARGET`.

## Scope and traceability

- Primary: `OBJ-01`, `OBJ-02`, `SAFE-03`, `PAIR-01`, `ARC-05`, `ARC-13`.
- Supporting: `SAFE-02`, `SAFE-10`.
- Acceptance: `HAP-001` is `PASS`; `HAP-002` remains `PENDING TARGET`.

## Evidence

- `src/hap/discovery/nativeDnsSd.ts` isolates the native service-discovery dependency behind a port.
- `src/hap/discovery/nativeNetwork.ts` derives the active Wi-Fi IPv4 CIDR from Android NetInfo and invalidates the snapshot on transport loss; the endpoint policy fails closed when that data is unavailable.
- `src/hap/discovery/txt.ts` parses and validates the HAP service record, including required identity, pairing-state metadata, and category classification.
- `src/hap/discovery/endpointPolicy.ts` accepts only a selected local IPv4 endpoint on the live Wi-Fi CIDR, rejects IPv6 in this first POC, and validates local-link membership without routing machinery.
- `src/hap/discovery/coordinator.ts` handles add, update, removal, deduplication, generation changes, interface changes, paired-identity matching, and a strict thermostat-category gate (`ci=9`). Known non-thermostat categories, missing categories, malformed categories, and unknown numeric categories are ignored before endpoint promotion.
- Selected endpoints are revalidated immediately before Pair Setup, Pair Verify, and lifecycle session connect, so a Wi-Fi/CIDR change cannot reuse a stale endpoint.
- The UI receives redacted discovery summaries rather than arbitrary network records.

## Live target result

- `HAP-001`: `PASS` (operator-recorded live Android result): the thermostat was discovered through `_hap._tcp`, a reachable local endpoint was resolved, and browse removal/reappearance was observed.
- The retained record is sanitized; raw IP, MAC, stable accessory ID, and complete TXT data are not included.
- `HAP-002` remains `PENDING TARGET` because the duplicate/address-change identity record is not part of this status update.
- Pairing and all post-discovery protocol operations were not run.

## Verification

```text
test/discovery/txt.test.ts         -> PASS
test/discovery/policy.test.ts      -> PASS
test/discovery/coordinator.test.ts -> PASS
test/discovery/nativeNetwork.test.ts -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
npm --prefix spikes/ecobee-hap-poc run test:ci -> PASS (31 suites, 73 tests)
```

The Android network guard and category filter remain implementation evidence for future runs; HAP-001's live result is recorded above. The deterministic discovery tests cover acceptance of `ci=9`, rejection of known non-thermostat categories, and fail-closed handling for missing, malformed, and unknown category metadata. No pairing was started for this update.
