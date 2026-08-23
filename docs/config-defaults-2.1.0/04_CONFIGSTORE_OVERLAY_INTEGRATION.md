# Phase 04 — ConfigStore Overlay Integration

Before implementation, read:

- `docs/config-defaults-2.1.0/00_IMPLEMENTATION_PLAN.md`
- `docs/config-defaults-2.1.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `implementation_evidence/config-defaults-2.1.0/phase-03.md`

## Objective

Make `ConfigStore` persist user intent while continuing to expose a resolved runtime `AppConfig` to existing consumers, including safe v1 migration, serialized writes, reset behavior, and corruption/I/O semantics.

## Why this phase exists

This is the stateful boundary. It should consume already-proven pure resolution and migration logic instead of mixing those concerns into AsyncStorage control flow.

## Authoritative requirements

- `DATA-001`
- `DATA-002`
- `DATA-003`
- `DATA-005`
- supporting `CON-005`, `TPL-009`, `SEC-001`

## Relevant SAD sections

- 2.1.0 `persistence_architecture`
- 2.1.0 ConfigStore interface/serialization rules
- 2.1.0 reset semantics

## In scope

- Change `ConfigStore` to load bundled defaults + persisted overlay and expose resolved `AppConfig`.
- Detect and migrate current v1 stored configuration.
- Persist canonical v2 overlay after successful migration.
- Preserve the existing in-process serialized write queue / no-lost-update behavior.
- Convert mutations of effective `AppConfig` back into canonical overlay state according to SAD 2.1.0.
- Reset Local Configuration discards/replaces only non-secret overlay state and resolves current bundled defaults.
- Ensure missing key means empty overlay, while corrupt/read-I/O-failure remain distinct failure states.
- Preserve public call sites where reasonable so unrelated app subsystems do not need configuration-provenance knowledge.

## Explicitly out of scope

- Bridge/Plug UI behavior;
- SecureStore changes;
- device calls;
- sync/cloud;
- database/journal introduction.

## Expected repository changes

### Existing prerequisites

- `src/storage/ConfigStore.ts`
- Phase 02 resolution modules
- Phase 03 schema/migration modules
- existing `src/app/bootstrap.ts` and ConfigStore tests

### Expected outputs

- revised `src/storage/ConfigStore.ts`
- any narrow config mutation helper required by SAD 2.1.0
- updated storage/bootstrap tests
- `implementation_evidence/config-defaults-2.1.0/phase-04.md`

## Required implementation behavior

- Normal load: `effective = resolve(bundledDefaults, persistedOverlay)`.
- Missing AsyncStorage key: use empty overlay; do not materialize defaults just to mark first launch.
- Corrupt value: return/configure ConfigCorrupt shell state; do not resolve as empty overlay and do not overwrite.
- Read I/O error: do not resolve as empty overlay.
- Failed write: committed in-memory config/overlay does not advance and UI must not be told save succeeded.
- Rapid mutations are serialized and based on the last committed state.
- Reset affects only the non-secret config key/overlay. It must not delete `HueBinding` from SecureStore.

If sparse canonicalization is selected, saving a value back to the current bundled value removes the redundant override rather than persisting it forever.

## Tests

- Missing key + defaults -> resolved config.
- Valid v2 overlay + defaults -> expected resolved config.
- v1 load -> migration -> persisted canonical v2 -> same resolved state.
- Concurrent Favorite + plug mutations do not lose either mutation.
- New default generation B changes effective non-overridden values without a storage rewrite.
- User overrides/removals remain authoritative under defaults B.
- Corrupt JSON and injected `getItem` failure show failure state and do not seed.
- Injected `setItem` failure does not advance committed config.
- Reset restores defaults and leaves a mocked SecureStore HueBinding untouched.

## Acceptance focus

- `AC-DATA-001`
- `AC-DATA-002` — local update simulation portion
- `AC-DATA-003`
- `AC-DATA-005`
- `AC-HUE-017` — reset/protected-binding portion

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/storage test/config test/app
git diff --check
```


## Persisted implementation evidence

Create or update `implementation_evidence/config-defaults-2.1.0/phase-04.md` using `docs/config-defaults-2.1.0/99_PHASE_HANDOFF_TEMPLATE.md`.

Record exact commands/results, requirement IDs addressed, acceptance criteria exercised, materially changed files, known limitations, target-gated work, and any SRS/SAD defect. Important state must not exist only in chat output.

## Exit criteria

- [ ] Every in-scope item exists.
- [ ] All required non-target-gated tests/checks pass.
- [ ] Evidence file for this phase is complete.
- [ ] No SRS/SAD issue is silently deferred.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
