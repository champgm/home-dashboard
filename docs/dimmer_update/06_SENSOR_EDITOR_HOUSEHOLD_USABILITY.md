# Phase 06 — Sensor Editor Household Usability

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Simplify ordinary Sensor editing for household use while preserving full management: prioritize name/configuration/reachability/battery/model and Configure Dimmer access; move raw capabilities/state/IDs/reference diagnostics behind Advanced; replace the current serialized-substring automation-reference scan with the exact parser from Phase 01.

## Why this phase exists

The user asked for Sensor editing generally to become easier, not only dimmers. The current editor exposes raw JSON-like details prominently and uses unsafe substring reference discovery. This phase cleans that surface after the dimmer-specific mechanisms are stable.

## Authoritative requirements

- `HUE-007`
- `HUE-021`
- `FR-013`
- `QA-001`
- `QA-003`

## Relevant SAD sections

- `hue_v1_design.dimmer_management.primary_editor`
- `hue_v1_design.dimmer_management.physical_identity`
- `supported_resource_semantics`
- `repository_structure`
- `architectural_decisions.ADR-022`

## In scope

- Reorganize `SensorEditor` into a concise normal section plus expandable Advanced details.
- Keep catalog-backed writable Sensor configuration fields and changed-field behavior; do not make Sensor `state` writable.
- For a recognized dimmer member Sensor, show a prominent Configure Dimmer action and keep direct Sensor details available as Advanced inspection.
- Replace `JSON.stringify(value).includes(...)` reference detection with exact parsed references from Phase 01.
- Present battery/reachability/model/current event in human-readable read-only form where present. Unsupported fields remain read-only/Advanced.

## Explicitly out of scope

- No new Sensor protocol operations beyond existing `HUE-007` behavior.
- No arbitrary raw JSON editor or direct `state.buttonevent` mutation.
- No duplicate dimmer automation editor inside SensorEditor.

## Expected repository changes

### Existing prerequisite files

- `src/ui/editors/SensorEditor.tsx`
- `src/ui/editors/editorControls.tsx`
- `src/protocol/hue/catalog/resourceCatalog.ts`
- `src/protocol/hue/dimmer/references.ts`
- `src/protocol/hue/dimmer/projector.ts`
- `test/ui/editors/managementEditors.test.tsx`

### Expected new/modified outputs

#### Existing files expected to modify

- `src/ui/editors/SensorEditor.tsx`
- `src/ui/editors/editorControls.tsx`

#### New files expected to create

- `test/ui/editors/SensorEditorUsability.test.tsx`
- `implementation_evidence/dimmer-2.4.1/phase-06.md`

## Required implementation behavior

- Normal Sensor editing must not lead with raw capabilities/current-state JSON.
- All existing supported writable config fields remain available and unsupported/read-only fields cannot be submitted.
- Automation references must be exact parsed references; similarly named IDs/text elsewhere in a resource must not produce false references.
- Recognized dimmer Sensor → Configure Dimmer is obvious, but individual Sensor inspection remains possible.
- Keep the screen operable in supported Pixel portrait dimensions with existing scrolling/layout primitives.

## Tests

- UI tests for ordinary sensor types represented by existing fixtures plus synthetic dimmer, unsupported, and missing-field Sensors.
- Assert raw capabilities/state appear only after Advanced expansion.
- Assert exact automation reference list accepts true Sensor paths and rejects textual/substring false positives.
- Regression-test existing Sensor create/config/update/delete and search behavior remains unchanged.

## Acceptance focus

- `AC-HUE-007`
- `AC-HUE-021`
- `AC-FR-013`
- `AC-QA-001`
- `AC-QA-003`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
npm run typecheck
npm test -- --runInBand test/ui/editors/SensorEditorUsability.test.tsx test/ui/editors/managementEditors.test.tsx test/protocol/hue/resources/resources.test.ts test/protocol/hue/search/searchLifecycle.test.ts
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-06.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] SensorEditor normal view is concise and Advanced contains raw details.
- [ ] Writable Sensor fields/operations remain complete and state remains read-only.
- [ ] Automation references use exact parsing, not substring matching.
- [ ] Configure Dimmer access is prominent for recognized members.
- [ ] Focused tests and typecheck pass.
- [ ] Phase evidence is persisted.
