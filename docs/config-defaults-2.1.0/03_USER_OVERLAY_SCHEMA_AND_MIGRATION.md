# Phase 03 — Persisted User-Overlay Schema and 2.0→2.1 Migration

Before implementation, read:

- `docs/config-defaults-2.1.0/00_IMPLEMENTATION_PLAN.md`
- `docs/config-defaults-2.1.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `implementation_evidence/config-defaults-2.1.0/phase-02.md`

## Objective

Define and test the persisted 2.1 user-overlay representation and a deterministic migration from the current 2.0 materialized `AppConfig` without losing plug identities, Favorites, settings, or explicit user choices.

## Why this phase exists

Update behavior cannot be correct until old full-config persistence is converted into provenance-aware user state. Keeping migration separate from ConfigStore orchestration limits the active reasoning set to schema and equivalence rules.

## Authoritative requirements

- `TPL-009`
- `DATA-001`
- `DATA-002`
- `DATA-003`
- `DATA-005`
- `SEC-001` (non-regression only)

## Relevant SAD sections

- 2.1.0 persistence schema/versioning section
- 2.1.0 bundled-default/user-overlay architecture
- `internal_domain_interfaces.types.AppConfig`

## In scope

- Introduce persisted schema version 2 if selected by SAD 2.1.0.
- Represent bridge override separately from the bundled bridge default.
- Represent seeded plug overrides separately from user additions.
- Represent explicit removals of seeded plug IDs (tombstones/removal set).
- Preserve Favorites and UI settings.
- Implement pure parser/serializer/migration functions.
- Migrate the current version-1 materialized config into a version-2 overlay.

## Explicitly out of scope

- AsyncStorage orchestration;
- UI;
- network/device calls;
- rewriting `HueBinding`;
- opportunistic migration guesses when installed data cannot be mapped safely.

## Expected repository changes

### Existing prerequisites

- `src/storage/configSchema.ts`
- `src/app/types.ts`
- Phase 02 bundled-default/resolution modules
- existing config storage tests/fixtures

### Expected outputs

- revised `src/storage/configSchema.ts` and/or explicit versioned schema modules
- migration helpers and fixtures
- focused migration tests under `test/storage/` and/or `test/config/`
- `implementation_evidence/config-defaults-2.1.0/phase-03.md`

## Required migration behavior

For each bundled plug ID in defaults B when migrating a 2.0 full config:

- same ID present with same endpoint → no override;
- same ID present with different endpoint → preserve as override;
- same ID absent → preserve absence as explicit removal;
- non-bundled persisted plug → preserve as user addition.

For the bridge:

- stored IPv4 equals bundled default → no override;
- stored IPv4 differs → preserve as override;
- stored IPv4 absent → no override, so the new bundled bridge default may become effective.

Preserve Favorites/settings exactly except for a deliberately documented plug-ID migration. Avoid re-keying. If an installed plug's current ID and proposed bundled ID differ, prefer changing the **bundled default ID** to the installed ID. Only implement a Favorite-rewriting migration if the 2.1 SAD explicitly approves it and an exact one-to-one mapping is proven.

Corrupt or unsupported persisted JSON must remain a ConfigCorrupt result; migration must not interpret it as an empty v2 overlay.

## Tests

- Realistic 2.0 serialized config fixture → exact expected v2 overlay.
- Missing bundled plug in v1 → removal tombstone.
- Modified bundled plug → override.
- Unrelated user-added plug → addition.
- Favorites/settings survive.
- Bridge same/different/absent cases.
- Unknown future schema version fails closed.
- Malformed v1/v2 data fails without emitting a replacement document.
- Migration + resolve produces the same effective configuration as the original 2.0 config before any new 2.1 defaults are introduced.

## Acceptance focus

- `AC-TPL-009`
- `AC-DATA-001`
- `AC-DATA-002`
- `AC-DATA-003`

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/storage test/config
git diff --check
```


## Persisted implementation evidence

Create or update `implementation_evidence/config-defaults-2.1.0/phase-03.md` using `docs/config-defaults-2.1.0/99_PHASE_HANDOFF_TEMPLATE.md`.

Record exact commands/results, requirement IDs addressed, acceptance criteria exercised, materially changed files, known limitations, target-gated work, and any SRS/SAD defect. Important state must not exist only in chat output.

## Exit criteria

- [ ] Every in-scope item exists.
- [ ] All required non-target-gated tests/checks pass.
- [ ] Evidence file for this phase is complete.
- [ ] No SRS/SAD issue is silently deferred.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
