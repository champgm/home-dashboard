# Phase 05 — Structural Dimmer Changes

- Status: `complete`
- Date: `2026-08-27`
- Commit/revision: working tree; no commit was created by this task

## Work completed

- Added ephemeral `DimmerChangeSet` preview/validation and a concise structural preview component.
- Structural previews are now produced only by a recognized catalog form whose existing-Rule matcher passes for the selected dimmer binding; the preview rejects one-resource Rule updates as simple edits, and navigation parameters cannot inject concrete operations.
- Added sequential `ApplicationService.commitStructuralEdit` execution through the existing Hue mutation boundary, with one busy gate, one final authoritative refresh, stop-on-definite/ambiguous/partial/abandoned behavior, and per-operation succeeded/failed-or-ambiguous/unattempted reporting.
- The UI retains and renders the service report as separate succeeded, failed-or-ambiguous, and unattempted operation sections after refresh.
- Preserved the existing destructive confirmation boundary for delete-containing sets and normalized destructive metadata from the operation kind.
- Added deterministic synthetic structural fixture coverage for a valid two-Rule Scene-cycle update with alphanumeric Scene IDs, existing-Rule mismatch read-only behavior, binding-identity revalidation, ordered success, each failure position, timeout-after-send, policy rejection, and delete confirmation coverage in the separate structural UI fixture.

## Requirements addressed

- `HUE-022` — structural multi-resource preview/confirmation/commit semantics.
- `HUE-008`, `HUE-016`, `HUE-020`, `REL-003` — existing validation, policy, changed-field, and ambiguous-result paths.
- `UX-DEL-001`, `UX-DEL-002`, `UX-DEL-003` — delete confirmation remains separate and deliberate.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-022` | PASS — LOCAL SYNTHETIC / target pending | catalog-scoped two-Rule Scene-cycle recognition, valid Hue action payload preview/commit, one-resource structural rejection, value editor, structural service/UI report tests; live household form remains pending |
| `AC-HUE-008` | PASS — LOCAL | Rule validation/policy regression |
| `AC-HUE-016` | PASS — LOCAL | immediate policy boundary |
| `AC-HUE-020` | PASS — LOCAL | update payload validation |
| `AC-REL-003` | PASS — LOCAL | timeout/ambiguous stop and refresh tests |
| `AC-UX-DEL-001` | PASS — LOCAL | existing and structural delete confirmation component |
| `AC-UX-DEL-002` | PASS — LOCAL | no write on trigger/first confirmation; deliberate Confirm required |
| `AC-UX-DEL-003` | PASS — LOCAL / Pixel pending | modal action-area implementation; physical visual inspection remains open |

## Tests and checks executed

| Command/check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | strict TypeScript check |
| `npm test -- --runInBand test/app/dimmer/structuralChange.test.ts test/ui/dimmer/StructuralDimmerEdit.test.tsx test/app/destructive.test.ts test/ui/editors/delete/EditorDelete.test.tsx test/app/commands/hueAmbiguousReadback.test.ts` | PASS | valid multi-operation Scene-cycle update preview/commit, one-resource rejection, ordered success, all failure positions, timeout, UI confirmation, per-operation report rendering, route-scope regression, and regressions |
| `npm run test:ci` | PASS | full local regression suite |

## Files materially changed

- `src/app/dimmerEditing.ts`, `src/app/ApplicationService.ts` — finite preview/commit service boundary.
- `src/ui/components/DimmerStructuralChangePreview.tsx` — structural and delete confirmation boundary.
- `src/ui/screens/ConfigureDimmerScreen.tsx` — preview integration.
- `test/fixtures/dimmer/synthetic-structural.json`, `test/app/dimmer/structuralChange.test.ts`, `test/ui/dimmer/StructuralDimmerEdit.test.tsx` — fixture/tests.

## Diagnostics/observability evidence

- Failure paths exercised: definite rejection at each operation position, ambiguous response, timeout-after-send, background abandonment, and unattempted dependent operations.
- Credential-sensitive data checked/redacted: operation labels contain no credentials; diagnostics use existing bounded/redacted paths.
- Useful diagnostic observed: structural reports preserve the command result category and list every remaining operation as unattempted after a stop.

## Known limitations

- No production household structural form is exposed; the catalog has no characterized structural entry.
- No live destructive operation was attempted.

## Target-dependent checks not yet performed

- Optional live safe structural verification and Pixel modal visual inspection remain pending; synthetic/disposable local coverage is complete.

## Deviations or discovered specification/design problems

- None. `DimmerChangeSet` remains ephemeral and contains no graph/fingerprint/journal/rollback state.

## Handoff to next phase

- Preconditions now satisfied: common and structural write paths are separated and locally verified.
- Outputs the next phase may rely on: structural forms must be injected/characterized and must produce finite concrete operations.
- Important invariants/traps: stop after the first definite/ambiguous operation; never retry or compensate automatically.
- Do **not** assume: synthetic operations are safe to apply to the household bridge.

## Exit checklist

- [x] Required implementation exists.
- [x] Required focused tests pass.
- [x] Typecheck/required checks pass.
- [x] Evidence is persisted here.
- [x] No unresolved implementation issue is silently deferred.
- [x] Later-phase work was not pulled forward without justification.
