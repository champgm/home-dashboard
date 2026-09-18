# Phase 03 — Secure Controller Identity and Pairing-Record Store

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-02.md`

**Prerequisites:** Phases 01–02.

## Objective

Implement and test a versioned `expo-secure-store` adapter for controller identity and per-accessory pairing records, with explicit missing, corrupt, partial, incompatible, and repair-required states.

## Why this phase exists

Pairing protocols must not own storage mechanics or improvise crash behavior. This phase establishes a narrow persistence contract before live Pair Setup can create accessory-side state.

## Authoritative requirements

- PRIMARY: `OBJ-04`, `ARC-08`
- Supporting: `SAFE-01`, `SAFE-02`, `ARC-10`

## Relevant design sections

- `Credential store adapter`
- `Pairing flow`
- `Logging and evidence`

## In scope

- Install/configure `expo-secure-store` only in the spike.
- Define versioned controller/pairing record schemas using opaque byte encodings and redacted identifiers.
- Generate controller identity from injected qualified randomness interface; tests use deterministic fakes.
- Validate before use and reject partial/corrupt/unknown schema data.
- Serialize mutations and use a staged/committed marker or equivalent validation so interrupted writes are not accepted as complete.
- Provide explicit inspect/load/commit/mark-repair/delete-local operations; deletion remains separate from accessory unpair.
- Test Android backup/data-transfer configuration assumptions by inspection; final device audit remains Phase 14.

## Explicitly out of scope

- Pair Setup/Verify, accessory-side unpairing, setup-code persistence, UI cleanup flow, credential migration

## Expected repository changes

Existing prerequisites: Phase 01 ports and Phase 02 provider decision.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/credentials/`
- `spikes/ecobee-hap-poc/test/credentials/`
- spike Expo/native configuration required by SecureStore
- `implementation_evidence/ecobee-hap-poc/phase-03.md`

## Required implementation behavior

- Never store setup code or session keys.
- Never log serialized records, keys, or stable accessory/controller IDs.
- Load failure never silently creates a replacement identity for an existing record.
- Corruption/unknown version yields an actionable repair state and preserves evidence until explicit operator action.
- Local deletion cannot claim the accessory pairing was removed.

## Tests

- Schema encode/decode and version rejection.
- Missing, corrupt, truncated, partial-commit, interrupted-mutation, SecureStore read/write/delete failure.
- Concurrent mutation serialization.
- Logger/error UI redaction assertions.
- Fake-store restart proving committed records survive service reconstruction.

## Acceptance focus

- Advances `HAP-004`, `HAP-014`, and `HAP-015`; none completes without target pairing.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/credentials
npm --prefix spikes/ecobee-hap-poc run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-03.md`; record schema/version, atomicity model, negative tests, backup inspection, and limitations.

## Exit criteria

- [ ] Versioned protected-store adapter and deterministic fake exist.
- [ ] All persistence failure states are explicit and tested.
- [ ] No setup/session secret persistence or logging exists.
- [ ] Evidence is complete; accessory-side behavior remains out of scope.

