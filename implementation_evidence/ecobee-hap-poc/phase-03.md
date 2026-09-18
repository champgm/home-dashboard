# Ecobee HAP POC — Phase 03 Evidence

## Status

`COMPLETE` for deterministic versioned protected-record behavior and the Android backup configuration inspection.

## Scope and traceability

- Primary: `OBJ-04`, `ARC-08`.
- Supporting: `SAFE-01`, `SAFE-02`, `ARC-10`.
- Acceptance support: `HAP-004`, `HAP-014`, and `HAP-015` receive deterministic store evidence; live target pairing remains later work.

## Evidence

- `src/hap/credentials/record.ts` defines a versioned schema with strict lengths, opaque controller/accessory identifiers, and explicit record inspection states.
- `src/hap/credentials/secureStore.ts` stages a record, commits only after confirmed pairing, serializes access, and exposes missing, corrupt, incompatible, and repair states.
- Setup input, transient session material, and discovery data are not persisted by the store.
- Pair Setup loads the protected controller identity before creating a pairing record; local credential cleanup removes controller and per-accessory records separately from accessory-side removal.
- Android backup configuration disables backup of the protected store through the app configuration and secure-store plugin settings.
- Store tests cover commit, reload, corruption, version mismatch, repair, serialization, and local deletion behavior.

## Verification

```text
test/credentials/store.test.ts -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

Physical Android backup/restore inspection is retained for the security audit phase and is not claimed here.
