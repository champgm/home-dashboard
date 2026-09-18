# Ecobee HAP POC — Phase 09 Evidence

## Status

`PARTIAL`: enumeration, projection, metadata validation, and fake reads pass; M1 is `PENDING TARGET` because no physical paired read was performed.

## Scope and traceability

- Primary: `OBJ-06`, `OBJ-07`.
- Supporting: `ARC-03`, `ARC-11`.
- Acceptance: `HAP-006` and `HAP-007` are `PENDING TARGET` for the target capability/read trace.

## Evidence

- `src/hap/core/accessories/enumeration.ts` models accessory, service, and characteristic instances by instance identifier rather than array position.
- `src/hap/core/accessories/thermostatProjection.ts` recognizes thermostat services and projects only supported capabilities.
- Projection retains characteristic type, format, unit, range, step, permissions, source timestamp, and freshness metadata.
- `src/application/thermostatService.ts` requests fresh reads and rejects unsupported or stale data instead of inventing a capability.
- Tests cover duplicate identifiers, unsupported services, metadata bounds, writable capability selection, and fresh-value propagation.

## Verification

```text
test/accessories/enumeration.test.ts -> PASS
test/thermostat/service.test.ts      -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

### M1 — Protocol feasibility

`PENDING TARGET`. The deterministic transcript proves the protocol machinery can complete against a simulated accessory, but the charter does not permit M1 to pass without physical discovery, Pair Verify, enumeration, and current-value reads.
