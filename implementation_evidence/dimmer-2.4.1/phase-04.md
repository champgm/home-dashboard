# Phase 04 — Simple Dimmer Binding Editing

- Status: `complete`
- Date: `2026-08-27`
- Commit/revision: working tree; no commit was created by this task

## Work completed

- Added `saveSimpleBinding(edit)` and pure payload validation for the one-recognized-binding path.
- Reused `ApplicationService` changed-field Rule update, immediate Hue action policy, existing mutation gate/deadline/result classification, and authoritative refresh.
- Added catalog-constrained structured action/target controls for on/off, brighten/dim while held, Scene activation (including nonnumeric Scene IDs), and brightness/color setting; changing action type or target replaces the draft field set.
- Preserved unrelated Rule fields and made custom/uncharacterized bindings non-editable. A Rule with auxiliary conditions/actions is editable only when the selected catalog form explicitly matches and round-trips it; no provenance/takeover dialog or separate simple mutation preview is rendered.

## Requirements addressed

- `HUE-022` — direct one-Rule Save path.
- `HUE-008`, `HUE-016`, `HUE-020`, `REL-003`, `FR-013` — Rule policy, changed fields, diagnostics, and refresh semantics.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-022` | PASS — LOCAL SYNTHETIC / target pending | one Rule update, catalog-constrained forms/fields, direct Save, relative brightness controls, field replacement, auxiliary-condition/action preservation, policy rejection, and ambiguous tests |
| `AC-HUE-008` | PASS — LOCAL | Rule mutation/catalog regressions |
| `AC-HUE-016` | PASS — LOCAL | prohibited action forms remain rejected |
| `AC-HUE-020` | PASS — LOCAL | changed-field payload preserves name/status/unrelated fields |
| `AC-REL-003` | PASS — LOCAL | existing ambiguous read-back regression plus timeout coverage |
| `AC-FR-013` | PASS — LOCAL | catalog-backed action/target/field forms |

## Tests and checks executed

| Command/check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | strict TypeScript check |
| `npm test -- --runInBand test/app/dimmer/simpleBinding.test.ts test/ui/dimmer/SimpleDimmerEdit.test.tsx test/protocol/hue/actionPolicy/actionPolicy.test.ts test/app/commands/hueAmbiguousReadback.test.ts` | PASS | 1 update, independent catalog/device/event revalidation, full refresh after read-back, direct UI Save, catalog-constrained fields, field replacement, relative actions, auxiliary Rule preservation, and failure semantics |
| `npm run test:ci` | PASS | full local regression suite |

## Files materially changed

- `src/app/dimmerEditing.ts` — pure simple payload validator.
- `src/app/ApplicationService.ts` — public simple-save adapter and forced post-mutation refresh boundary.
- `src/ui/screens/ConfigureDimmerScreen.tsx` — direct structured Save controls.
- `test/app/dimmer/simpleBinding.test.ts`, `test/ui/dimmer/SimpleDimmerEdit.test.tsx` — one-update/presentation tests.

## Diagnostics/observability evidence

- Failure paths exercised: unavailable Rule, custom/uncharacterized Rule, policy rejection, characterization mismatch, ambiguous write, and timeout-after-send.
- Credential-sensitive data checked/redacted: no owner/API username is used as an edit gate or rendered in the simple path.
- Useful diagnostic observed: definite and ambiguous `CommandResult` messages are surfaced without a success claim.

## Known limitations

- Actual household action forms and physical behavior have not been verified without the target bridge/dimmer.

## Target-dependent checks not yet performed

- Live UI edit → physical button exercise → authoritative verification → explicit restore remains Phase 08 target work.

## Deviations or discovered specification/design problems

- None. No retry, rollback, ownership transfer, or fingerprint preflight was introduced.

## Handoff to next phase

- Preconditions now satisfied: common one-binding edits are isolated from multi-resource structural work.
- Outputs the next phase may rely on: `DimmerChangeSet` is reserved for structural operations; simple Save is one existing Rule update.
- Important invariants/traps: do not route a simple edit through create/delete or an extra confirmation.
- Do **not** assume: a local mock success establishes live household behavior.

## Exit checklist

- [x] Required implementation exists.
- [x] Required focused tests pass.
- [x] Typecheck/required checks pass.
- [x] Evidence is persisted here.
- [x] No unresolved implementation issue is silently deferred.
- [x] Later-phase work was not pulled forward without justification.
