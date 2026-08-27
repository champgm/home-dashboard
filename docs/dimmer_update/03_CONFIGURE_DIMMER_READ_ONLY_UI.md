# Phase 03 — Configure Dimmer Read-only UI

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Add the physical-device-oriented Configure Dimmer screen and navigation. A recognized dimmer opens directly into control/gesture rows with human-readable current actions/targets; low-level Hue details are hidden under Advanced but remain reachable, including links to individual Sensor and Rule editors.

## Why this phase exists

This phase proves the user-facing mental model before adding write controls. It keeps React/navigation reasoning separate from mutation semantics and is the primary implementation owner for `HUE-021`.

## Authoritative requirements

- `HUE-021`
- `FR-013`
- `QA-001`
- `QA-003`

## Relevant SAD sections

- `architectural_decisions.ADR-022`
- `hue_v1_design.dimmer_management.primary_editor`
- `hue_v1_design.dimmer_management.custom_behavior`
- `runtime_components`
- `repository_structure`

## In scope

- Add a `ConfigureDimmerScreen` (or equivalent editor screen) that consumes `DimmerEditorModel`.
- Organize the normal view by physical control and gesture; show current action and human-readable Light/Group/Scene target.
- Add an expandable/collapsible Advanced section for exact IDs, raw event values, helper/reference resources, creator provenance, malformed/custom bindings, and navigation to ordinary Sensor/Rule editors.
- Change Sensor edit routing so a Sensor belonging to a recognized physical dimmer opens Configure Dimmer as the primary edit workflow. Ordinary/non-dimmer Sensors still open `SensorEditor`.
- Ensure multiple Sensor resources that resolve to the same physical device route to the same Configure Dimmer device key without grouping by display name.

## Explicitly out of scope

- No mutation controls yet; Phase 04 adds simple Save and Phase 05 adds structural changes.
- No redesign of legacy dashboard tiles/top tabs.
- No production model mapping; UI tests inject synthetic recognized models.

## Expected repository changes

### Existing prerequisite files

- `src/ui/navigation/AppNavigation.tsx`
- `src/ui/screens/SensorsScreen.tsx`
- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/editors/SensorEditor.tsx`
- `src/ui/editors/RuleEditor.tsx`
- `src/ui/editors/editorControls.tsx`
- `src/ui/AppContext.tsx`
- `src/protocol/hue/dimmer/projector.ts`

### Expected new/modified outputs

#### Existing files expected to modify

- `src/ui/navigation/AppNavigation.tsx`
- `src/ui/screens/SensorsScreen.tsx`
- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/editors/SensorEditor.tsx`

#### New files expected to create

- `src/ui/screens/ConfigureDimmerScreen.tsx`
- `src/ui/components/DimmerControlRow.tsx`
- `src/ui/components/ExpandableAdvancedSection.tsx`
- `test/ui/dimmer/ConfigureDimmerScreen.test.tsx`
- `test/ui/dimmer/SensorDimmerRouting.test.tsx`
- `implementation_evidence/dimmer-2.4.1/phase-03.md`

## Required implementation behavior

- The normal screen must not require the user to read Sensor IDs, Rule IDs, Schedule/Resource-Link IDs, raw event numbers, or JSON.
- Advanced must preserve those details and provide an explicit path to individual Sensor/Rule inspection.
- Ambiguous/custom/unsupported rows are visible and clearly non-editable, not silently dropped.
- No edit route may associate a dimmer by display name.
- Portrait layout must keep all required controls reachable on supported Pixel dimensions; use existing Screen/safe-area/navigation patterns rather than adding new inset logic.

## Tests

- Render recognized four-control synthetic dimmer and verify control/gesture/action/target labels.
- Assert raw IDs/event numbers are absent from the normal section and present after expanding Advanced.
- Assert custom/malformed/missing-target rows remain visible and non-editable.
- Navigation tests: recognized member Sensor → Configure Dimmer; ordinary Sensor → SensorEditor; Advanced Rule/Sensor links reach the existing editors.
- Layout test on the existing Pixel portrait test dimensions to ensure Advanced and control rows remain reachable.

## Acceptance focus

- `AC-HUE-021`
- `AC-FR-013`
- `AC-QA-001`
- `AC-QA-003`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
npm run typecheck
npm test -- --runInBand test/ui/dimmer/ConfigureDimmerScreen.test.tsx test/ui/dimmer/SensorDimmerRouting.test.tsx test/ui/editors/managementEditors.test.tsx test/ui/safeArea/navigationShell.test.tsx
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-03.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] Recognized dimmers use Configure Dimmer as their primary edit route.
- [ ] Normal and Advanced information boundaries match `HUE-021`.
- [ ] Individual Sensor/Rule details remain reachable.
- [ ] No writes were introduced.
- [ ] Focused tests and typecheck pass.
- [ ] Phase evidence is persisted.
