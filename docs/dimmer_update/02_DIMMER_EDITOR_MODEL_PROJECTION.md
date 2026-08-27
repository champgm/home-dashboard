# Phase 02 — Dimmer Editor Model Projection

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Build the pure snapshot-to-`DimmerEditorModel` projection that presents physical controls/gestures, recognized human-readable action/target mappings, Advanced low-level references, and explicit custom/unsupported rows using injected catalog data.

## Why this phase exists

Configure Dimmer should consume one deterministic view model rather than reconstructing Hue automation relationships in React components. Keeping recognition/projection pure makes malformed/custom cases and synthetic structural fixtures cheap to test.

## Authoritative requirements

- `HUE-021`
- `HUE-022`
- `HUE-008`
- `HUE-016`
- `HUE-020`

## Relevant SAD sections

- `architectural_decisions.ADR-022`
- `hue_v1_design.dimmer_management.primary_editor`
- `hue_v1_design.dimmer_management.custom_behavior`
- `internal_domain_interfaces.types.DimmerEditorModel`
- `internal_domain_interfaces.services.DimmerEditing`

## In scope

- Implement `buildEditorModel(sensorRef,snapshot,catalog)` or the equivalent SAD-selected pure projector.
- Recognize only catalog-supported button/gesture event forms and permitted Rule action forms: on/off, light/group set values (including brightness/color fields already accepted by the Hue catalog), Scene activation, and catalog-characterized Scene cycling.
- Resolve target labels from the authoritative snapshot while retaining exact `(kind,id)` references.
- Classify bindings as editable simple, recognized structural, custom/unrecognized, malformed, missing-target, or ambiguous without rewriting anything.
- Populate Advanced data with member Sensor IDs, raw button-event values, exact referenced resources, helper resources when present, Rule/Schedule/Resource-Link IDs, and credential-safe creator provenance.

## Explicitly out of scope

- No React UI, navigation, writes, confirmations, or production household catalog entry.
- No generalized automation graph, dependency solver, ownership database, or mutation fingerprints.
- No attempt to make arbitrary custom Rules editable through Configure Dimmer.

## Expected repository changes

### Existing prerequisite files

- `src/protocol/hue/dimmer/types.ts`
- `src/protocol/hue/dimmer/references.ts`
- `src/protocol/hue/dimmer/modelCatalog.ts`
- `src/protocol/hue/catalog/resourceCatalog.ts`
- `src/protocol/hue/catalog/rules.ts`
- `src/protocol/hue/resources/rules.ts`
- `src/app/types.ts`

### Expected new/modified outputs

#### Existing files expected to modify

- `src/protocol/hue/dimmer/types.ts`
- `src/protocol/hue/dimmer/modelCatalog.ts`

#### New files expected to create

- `src/protocol/hue/dimmer/projector.ts`
- `src/protocol/hue/dimmer/actions.ts`
- `test/protocol/hue/dimmer/projector.test.ts`
- `test/fixtures/dimmer/synthetic-recognized.json`
- `test/fixtures/dimmer/synthetic-malformed-custom.json`
- `implementation_evidence/dimmer-2.4.1/phase-02.md`

## Required implementation behavior

- The default view-model fields must be human-oriented; raw IDs/events belong in Advanced fields.
- Exact references are authoritative. If a referenced target is missing, retain the binding and mark the target unavailable; do not retarget by name.
- Creator/owner provenance is informational and credential-safe; it does not make a simple recognized binding non-editable.
- Custom/unrecognized Rules remain visible and read-only through this model.
- Synthetic tests may inject a fake model catalog. Production catalog data still waits for Phase 07.

## Tests

- Fixture tests for each supported action representation using an injected synthetic model catalog.
- Negative tests for same-name targets, missing targets, unsupported event numbers, malformed resource paths, multiple possible physical identities, and custom Rule bodies.
- Test raw numeric events/IDs appear only in Advanced model fields, while normal rows expose control/gesture/action/target labels.
- Test Rule owner/provenance is retained without any API username/credential leakage.

## Acceptance focus

- `AC-HUE-021`
- `AC-HUE-022`
- `AC-HUE-008`
- `AC-HUE-016`
- `AC-HUE-020`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
npm run typecheck
npm test -- --runInBand test/protocol/hue/dimmer/projector.test.ts test/protocol/hue/catalog/resourceCatalog.test.ts test/protocol/hue/actionPolicy/actionPolicy.test.ts
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-02.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] Pure `DimmerEditorModel` projection exists and is independent of React/network/persistence.
- [ ] Recognized/common synthetic action forms and all required negative cases are covered.
- [ ] No custom/unrecognized binding becomes writable.
- [ ] Focused tests and typecheck pass.
- [ ] Phase evidence is persisted.
