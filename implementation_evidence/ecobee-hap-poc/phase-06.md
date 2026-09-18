# Ecobee HAP POC — Phase 06 Evidence

## Status

`COMPLETE` for the adapterized deterministic transport and wire layer.

## Scope and traceability

- Primary: `ARC-03`, `ARC-06`.
- Supporting: `SAFE-03`, `SAFE-04`, `ARC-07`.
- Infrastructure supplied for later `HAP-003` through `HAP-010` target checks.

## Evidence

- `src/hap/transport/nativeTcp.ts` provides bounded, cancellable TCP connection behavior through a native adapter.
- `src/hap/core/wire/http.ts` incrementally parses and serializes HAP HTTP messages without assuming packet boundaries.
- `src/hap/core/wire/tlv8.ts` enforces bounded TLV parsing, repeated values, separators, and long-value fragmentation.
- `src/hap/core/wire/encryptedRecords.ts` implements HAP record framing, arbitrary fragmentation, nonce progression, and authentication through the qualified crypto port.
- `src/hap/transport/httpSession.ts` owns request serialization, response parsing, encrypted framing, timeout, close, and generation-safe event delivery.
- No UI import, BLE path, server listener, arbitrary host field, or raw console was added.

## Verification

```text
test/wire/tlv8.test.ts             -> PASS
test/wire/http.test.ts             -> PASS
test/wire/encryptedRecords.test.ts -> PASS
test/transport/session.test.ts     -> PASS
test/transport/nativeTcp.test.ts   -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```
