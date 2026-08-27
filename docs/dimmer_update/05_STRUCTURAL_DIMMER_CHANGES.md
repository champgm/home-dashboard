# Phase 05 — Structural Dimmer Changes

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Implement the rare structural dimmer path using the SAD-selected lightweight `DimmerChangeSet`: one concise concrete operation list, explicit confirmation, sequential in-process execution under the existing Hue mutation boundary, stop-and-refresh on the first definite/ambiguous failure, and no retry/rollback/repair subsystem.

## Why this phase exists

`HUE-022` also defines behavior when one UI action truly spans multiple Hue resources. Keeping this phase separate prevents rare orchestration/failure reasoning from contaminating the simple household edit path. This phase is the primary implementation owner for `HUE-022`.

## Authoritative requirements

- `HUE-022`
- `HUE-008`
- `HUE-016`
- `HUE-020`
- `REL-003`
- `UX-DEL-001`
- `UX-DEL-002`
- `UX-DEL-003`

## Relevant SAD sections

- `architectural_decisions.ADR-022`
- `hue_v1_design.dimmer_management.structural_edit`
- `hue_v1_design.dimmer_management.failure_behavior`
- `internal_domain_interfaces.types.DimmerChangeSet`
- `internal_domain_interfaces.services.DimmerEditing`
- `state_and_concurrency`
- `failure_and_deadline_architecture`

## In scope

- Implement `previewStructuralEdit(edit)` to derive only the concrete create/update/enable/disable/delete operations needed for that recognized structural form.
- Render a concise human-readable preview naming affected resource kinds/labels and operation types; require one structural confirmation before writes.
- If the change set includes a delete, invoke the existing destructive confirmation flow required by `UX-DEL-001..003` in addition to the structural confirmation selected by ADR-022.
- Implement sequential commit using the existing Hue validation/pacing/result classification. Refactor the internal ApplicationService mutation primitive only as needed to keep one Hue structural sequence serialized and perform the SAD-required authoritative refresh without adding a second coordinator or durable state.
- Stop dependent operations on the first definite or ambiguous failure. Return/display succeeded, failed-or-ambiguous, and unattempted operations after refresh.
- Build deterministic synthetic structural fixtures; expose only structural forms that the injected catalog identifies as recognized.

## Explicitly out of scope

- No generalized dependency graph, topological planner, resource fingerprints, durable transaction journal, rollback, retry, compensation, repair worker, or distributed lock.
- No custom/unrecognized automation rewrite.
- No new production household structural form until Phase 07 characterization establishes one; synthetic fixtures are sufficient for local executor/UX tests.

## Expected repository changes

### Existing prerequisite files

- `src/app/ApplicationService.ts`
- `src/app/dimmerEditing.ts`
- `src/app/commandResults.ts`
- `src/app/destructiveActions.ts`
- `src/ui/components/ConfirmDestructiveAction.tsx`
- `src/ui/screens/ConfigureDimmerScreen.tsx`
- `src/protocol/hue/dimmer/projector.ts`

### Expected new/modified outputs

#### Existing files expected to modify

- `src/app/ApplicationService.ts`
- `src/app/dimmerEditing.ts`
- `src/ui/screens/ConfigureDimmerScreen.tsx`

#### New files expected to create

- `src/ui/components/DimmerStructuralChangePreview.tsx`
- `test/app/dimmer/structuralChange.test.ts`
- `test/ui/dimmer/StructuralDimmerEdit.test.tsx`
- `implementation_evidence/dimmer-2.4.1/phase-05.md`

## Required implementation behavior

- `DimmerChangeSet` is an ephemeral list for one user action only. It must not contain generalized dependency/fingerprint/transaction state.
- Every operation is validated by the same catalog/action-policy rules as ordinary Hue edits before execution.
- No operation after a definite/ambiguous failure is attempted.
- After success or stop, authoritative Hue state is refreshed and the result report is based on actual per-operation outcomes.
- An ambiguous write is never automatically repeated or rolled back.
- Delete confirmation must still identify the object/consequence and keep the confirm action spatially separated from the trigger.

## Tests

- Synthetic structural success test verifies ordered operations, one structural confirmation, and refreshed state.
- Inject failure at each operation position and verify later operations are unattempted.
- Inject timeout-after-send and verify ambiguous classification, stop, refresh, no retry, and no rollback.
- UI test verifies custom/unrelated resources are not included in the change set.
- Destructive structural fixture verifies existing delete-confirmation behavior before DELETE is sent.
- Run existing destructive-action and ambiguous-write regression suites.

## Acceptance focus

- `AC-HUE-022`
- `AC-HUE-008`
- `AC-HUE-016`
- `AC-HUE-020`
- `AC-REL-003`
- `AC-UX-DEL-001`
- `AC-UX-DEL-002`
- `AC-UX-DEL-003`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
npm run typecheck
npm test -- --runInBand test/app/dimmer/structuralChange.test.ts test/ui/dimmer/StructuralDimmerEdit.test.tsx test/app/destructive.test.ts test/ui/editors/delete/EditorDelete.test.tsx test/app/commands/hueAmbiguousReadback.test.ts
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-05.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] Lightweight structural preview/commit path exists without generalized transaction machinery.
- [ ] Stop/refresh/report semantics pass success, definite-failure, and ambiguous-failure tests.
- [ ] Delete-containing structural changes retain mandatory destructive confirmation.
- [ ] No automatic retry/rollback/repair behavior exists.
- [ ] Focused tests and typecheck pass.
- [ ] Phase evidence is persisted.
