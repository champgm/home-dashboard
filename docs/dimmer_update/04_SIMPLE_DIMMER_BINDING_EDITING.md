# Phase 04 — Simple Dimmer Binding Editing

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Enable the common household edit path for one existing recognized binding: choose a structured action/target and press Save; the app emits exactly one ordinary changed-field Rule update and refreshes authoritative Hue state without a mutation-preview dialog or provenance/takeover confirmation.

## Why this phase exists

This is the highest-frequency user operation and must stay separate from rare multi-resource structural work. It reuses the existing Rule validation/mutation path instead of creating a new transaction mechanism.

## Authoritative requirements

- `HUE-022`
- `HUE-008`
- `HUE-016`
- `HUE-020`
- `REL-003`
- `FR-013`

## Relevant SAD sections

- `architectural_decisions.ADR-022`
- `hue_v1_design.dimmer_management.simple_edit`
- `hue_v1_design.dimmer_management.failure_behavior`
- `internal_domain_interfaces.services.DimmerEditing`
- `state_and_concurrency`
- `failure_and_deadline_architecture`

## In scope

- Implement the SAD `saveSimpleBinding(edit)` behavior using the existing Rule changed-field, action-policy, mutation-classification, and authoritative-refresh path.
- Add structured Configure Dimmer controls for action type and target selection from current Light/Group/Scene resources; expose brightness/color fields only when the recognized binding/catalog form permits them.
- Update only the one recognized binding/Rule represented by the edited row. Preserve unrelated conditions/actions/fields by changed-field semantics.
- Retain creator provenance as Advanced information only; do not ask for takeover confirmation solely because another Hue API user created the Rule.
- Surface existing command diagnostics on definite/ambiguous failure without claiming success.

## Explicitly out of scope

- No create/delete/replace or multi-resource edit; those are Phase 05.
- No automatic retry, rollback, ownership transfer, resource fingerprinting, or background repair.
- No editing of custom/unrecognized bindings.

## Expected repository changes

### Existing prerequisite files

- `src/app/ApplicationService.ts`
- `src/app/commandResults.ts`
- `src/app/diagnostics.ts`
- `src/protocol/hue/changedFields.ts`
- `src/protocol/hue/HueActionPolicy.ts`
- `src/protocol/hue/resources/rules.ts`
- `src/protocol/hue/catalog/resourceCatalog.ts`
- `src/ui/screens/ConfigureDimmerScreen.tsx`
- `src/ui/editors/editorControls.tsx`

### Expected new/modified outputs

#### Existing files expected to modify

- `src/ui/screens/ConfigureDimmerScreen.tsx`
- `src/app/ApplicationService.ts`

#### New files expected to create

- `src/app/dimmerEditing.ts`
- `test/app/dimmer/simpleBinding.test.ts`
- `test/ui/dimmer/SimpleDimmerEdit.test.tsx`
- `implementation_evidence/dimmer-2.4.1/phase-04.md`

## Required implementation behavior

- Save of a simple edit must cause one Rule update command, not a create/delete sequence.
- The payload must contain only fields intentionally changed by the dimmer edit; unchanged Rule name/status/other conditions/actions must not be rewritten unless the specific Rule representation requires the edited collection field.
- Use the existing immediate-operation safety policy; prohibited bridge/admin/delete actions cannot be authored.
- A timeout-after-send follows existing ambiguous-write behavior, including one read-back where observable; no blind retry.
- The UI must not show a separate mutation plan or an extra owner/provenance confirmation for this path.

## Tests

- Unit/integration test that changing one action target produces exactly one `mutateHue("rule", id, "update", ...)` path and an authoritative refresh.
- Inspect the prepared Rule payload for changed-field behavior and preservation of unrelated Rule data.
- UI test verifies Save is direct and no structural-preview/provenance confirmation is rendered.
- Negative tests reject prohibited/raw/custom action forms and leave custom bindings read-only.
- Ambiguous outcome regression test verifies no success claim or automatic retry.

## Acceptance focus

- `AC-HUE-022`
- `AC-HUE-008`
- `AC-HUE-016`
- `AC-HUE-020`
- `AC-REL-003`
- `AC-FR-013`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
npm run typecheck
npm test -- --runInBand test/app/dimmer/simpleBinding.test.ts test/ui/dimmer/SimpleDimmerEdit.test.tsx test/protocol/hue/actionPolicy/actionPolicy.test.ts test/app/commands/hueAmbiguousReadback.test.ts
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-04.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] Simple recognized binding edit is one direct changed-field Rule update.
- [ ] No extra preview/takeover confirmation exists on the simple path.
- [ ] Custom/unrecognized bindings remain non-editable through Configure Dimmer.
- [ ] Failure/ambiguous behavior reuses existing safe semantics.
- [ ] Focused tests and typecheck pass.
- [ ] Phase evidence is persisted.
