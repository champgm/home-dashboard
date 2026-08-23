# Phase 02 — Bundled Defaults and Pure Resolution Model

Before implementation, read:

- `docs/config-defaults-2.1.0/00_IMPLEMENTATION_PLAN.md`
- `docs/config-defaults-2.1.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `implementation_evidence/config-defaults-2.1.0/phase-01.md`

## Objective

Create a deterministic, storage-independent model that validates bundled defaults and resolves them with a user overlay into the runtime `AppConfig`.

## Why this phase exists

Merge precedence is the core correctness rule. It should be proven as pure logic before storage migration, UI, or AsyncStorage behavior is introduced.

## Authoritative requirements

- `HUE-001`
- `HUE-012`
- `TPL-002`
- `TPL-009`
- `DATA-001`
- `DATA-002`
- `CON-010`

## Relevant SAD sections

Use the final 2.1.0 sections that replace/extend:

- `preseed_architecture`
- `persistence_architecture`
- `internal_domain_interfaces.types.AppConfig`
- `internal_domain_interfaces.services.ConfigStore`

## In scope

- Replace/generalize `src/config/plugPreseed.ts` with `src/config/bundledDefaults.ts` or the exact 2.1.0 SAD-selected equivalent.
- Bundle a defaultable Hue bridge private IPv4 field plus plug endpoints.
- Define explicit types for bundled defaults and the user overlay selected by SAD 2.1.0.
- Implement a **pure** `resolveConfig(defaults, overlay)` or SAD-equivalent function.
- Validate all bundled bridge/plug IPv4/ports before resolution.
- Validate unique bundled plug IDs.
- Document the release invariant that a bundled plug ID is never reused for a different physical plug.
- For already-configured household plugs, choose initial bundled IDs that match current installed endpoint IDs wherever feasible. Once published, those IDs become immutable even if the IP later changes.

## Explicitly out of scope

- AsyncStorage reads/writes;
- schema migration;
- Bridge/Plug UI changes;
- Hue SecureStore binding changes;
- actual household address values if they have not yet been supplied to the implementer.

## Expected repository changes

### Existing prerequisites

- `src/config/plugPreseed.ts`
- `src/config/endpointValidation.ts`
- `src/app/types.ts`
- `test/config/`

### Expected outputs

- `src/config/bundledDefaults.ts`
- pure resolution/overlay helper file(s) selected by SAD 2.1.0
- corresponding type changes
- focused unit tests under `test/config/`
- removal or compatibility retirement of `src/config/plugPreseed.ts`
- `implementation_evidence/config-defaults-2.1.0/phase-02.md`

## Required implementation behavior

Resolution precedence must be deterministic:

```text
explicit removal > explicit override > bundled default > absent
```

for bundled plug endpoints, while user additions are included independently.

Important invariants:

- a newly added bundled plug appears when no tombstone/override exists;
- a changed bundled value is visible only if the phone has not overridden that field/endpoint;
- an explicitly removed bundled plug never reappears merely because the APK still bundles it;
- an override equal to the current bundled value may be normalized away if SAD 2.1.0 selects sparse canonical overlays;
- invalid bundled defaults fail tests/build-time validation rather than becoming runtime network destinations;
- no credential or physical TP-Link alias is bundled.

## Tests

Pure table-driven tests for at least:

- empty overlay + bridge default;
- empty overlay + multiple plug defaults;
- bridge override;
- seeded plug override;
- seeded plug removal;
- user-added plug;
- new seed appearing between default generation A and B;
- changed seed value A→B with no override;
- changed seed value A→B with override;
- removed seed remains removed A→B;
- duplicate/invalid seed IDs/IPs/ports rejected;
- deterministic/idempotent resolution.

## Acceptance focus

- `AC-HUE-001` — pure default/override semantics advanced.
- `AC-TPL-009` — update/default precedence advanced.
- `AC-DATA-002` — upgrade semantics advanced.

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/config
git diff --check
```


## Persisted implementation evidence

Create or update `implementation_evidence/config-defaults-2.1.0/phase-02.md` using `docs/config-defaults-2.1.0/99_PHASE_HANDOFF_TEMPLATE.md`.

Record exact commands/results, requirement IDs addressed, acceptance criteria exercised, materially changed files, known limitations, target-gated work, and any SRS/SAD defect. Important state must not exist only in chat output.

## Exit criteria

- [ ] Every in-scope item exists.
- [ ] All required non-target-gated tests/checks pass.
- [ ] Evidence file for this phase is complete.
- [ ] No SRS/SAD issue is silently deferred.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
