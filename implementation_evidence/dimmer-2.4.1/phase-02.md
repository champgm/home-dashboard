# Phase 02 — Dimmer Editor Model Projection

- Status: `complete`
- Date: `2026-08-27`
- Commit/revision: working tree; no commit was created by this task

## Work completed

- Added the pure snapshot-to-`DimmerEditorModel` projector and action projection helpers.
- Projected catalog controls/gestures, human-readable Light/Group/Scene targets, exact Advanced references, raw events, helper Sensors, schedules, Resource Links, and safe creator provenance.
- Added first-class relative brightness (`bri_inc`) action projection, catalog-declared simple action/target/field forms, and characterized Scene-cycle structural forms with explicit editor values, existing-Rule matchers, and multi-resource operation contracts.
- Retained a credential-safe Rule conditions/actions shape in each projected binding so simple and structural builders can validate and round-trip the existing automation instead of recognizing from the event number alone.
- Kept custom, malformed, unsupported, missing-target, and ambiguous cases visible and non-editable; normal rows do not carry Hue target IDs or raw event values.
- Added recognized, malformed/custom, structural, and synthetic structural fixture coverage, including unsupported-model/link-only automation metadata. The production catalog remains empty pending characterization.

## Requirements addressed

- `HUE-021` — physical-control-first projection and Advanced boundary.
- `HUE-022` — recognized simple/structural classification without arbitrary Rule rewriting.
- `HUE-008`, `HUE-016`, `HUE-020` — Rule/action policy and exact changed-resource semantics are reused.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-021` | PASS — LOCAL SYNTHETIC / target pending | projector and identity tests cover labels, exact refs, missing targets, custom/malformed rows |
| `AC-HUE-022` | PASS — LOCAL SYNTHETIC / target pending | catalog-constrained on/off, set, relative brightness, Scene activation (including alphanumeric Scene IDs), and genuinely multi-resource Scene-cycle contracts; malformed structural/custom Rules remain read-only; live household forms remain pending |
| `AC-HUE-008` | PASS — LOCAL | Rule parser/catalog/policy regressions |
| `AC-HUE-016` | PASS — LOCAL | immediate action policy remains the only authored-action boundary |
| `AC-HUE-020` | PASS — LOCAL | exact references and changed-field path preserve unrelated fields |

## Tests and checks executed

| Command/check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | strict TypeScript check |
| `npm test -- --runInBand test/protocol/hue/dimmer/projector.test.ts test/protocol/hue/catalog/resourceCatalog.test.ts test/protocol/hue/actionPolicy/actionPolicy.test.ts` | PASS | synthetic recognized, relative-action, catalog-constrained/multi-condition, genuinely multi-resource structural update, alphanumeric Scene, unsupported/link-only metadata, and negative projection coverage |
| `npm run test:ci` | PASS | full local regression suite; final rerun recorded in Phase 08 |

## Files materially changed

- `src/protocol/hue/dimmer/projector.ts` — pure projection/classification.
- `src/protocol/hue/dimmer/actions.ts` — permitted structured action construction.
- `test/fixtures/dimmer/synthetic-recognized.json`, `synthetic-malformed-custom.json`, `synthetic-structural.json` — deterministic local fixtures.
- `test/protocol/hue/dimmer/projector.test.ts` — positive/negative projection tests.

## Diagnostics/observability evidence

- Failure paths exercised: unsupported model/event, ambiguous catalog, malformed reference, missing target, uncharacterized action/field form, custom multi-action Rule, malformed structural Rule, and unbound gesture.
- Credential-sensitive data checked/redacted: normal projections omit owners/API usernames; Advanced paths are credential-redacted.
- Useful diagnostic observed: every non-editable row carries a human reason and classification instead of disappearing.

## Known limitations

- Synthetic catalog injection proves the generic mechanism but cannot establish the deployed household model/event table.

## Target-dependent checks not yet performed

- Actual household control/gesture labels and event observations remain Phase 07/08 target gates.

## Deviations or discovered specification/design problems

- None. No graph planner, fingerprint, ownership, or repair state was added.

## Handoff to next phase

- Preconditions now satisfied: Configure Dimmer can consume one deterministic physical-device model.
- Outputs the next phase may rely on: normal rows use labels; Advanced retains exact references and low-level diagnostics.
- Important invariants/traps: target identity comes only from exact `(kind,id)` references; names are presentation only.
- Do **not** assume: synthetic event numbers are production household observations.

## Exit checklist

- [x] Required implementation exists.
- [x] Required focused tests pass.
- [x] Typecheck/required checks pass.
- [x] Evidence is persisted here.
- [x] No unresolved implementation issue is silently deferred.
- [x] Later-phase work was not pulled forward without justification.
