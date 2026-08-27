# Phase 01 — Dimmer Reference and Identity Foundation

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Add the deterministic, write-free dimmer reference/identity foundation required to associate Hue Sensor and automation resources without names or substring matching. The phase ends with testable catalog interfaces and exact reference parsing but no Configure Dimmer UI and no production household model mapping.

## Why this phase exists

The current `SensorEditor` discovers references by serializing resources and using string containment. That cannot satisfy `HUE-021`. Exact reference parsing and model-aware physical identity are pure logic and should be proven before UI or mutation work.

## Authoritative requirements

- `HUE-021`
- `HUE-008`
- `QA-003`

## Relevant SAD sections

- `architectural_decisions.ADR-022`
- `hue_v1_design.dimmer_management.physical_identity`
- `hue_v1_design.dimmer_management.event_catalog`
- `internal_domain_interfaces.types.DimmerEditorModel`
- `repository_structure`

## In scope

- Add a small `src/protocol/hue/dimmer/` module boundary for dimmer-specific pure types/catalog/reference logic.
- Parse Rule condition/action, Schedule command, and Resource Link references into exact Hue resource references using structural path parsing; retain malformed/unrecognized input as inspectable data rather than coercing it.
- Define the minimal model-catalog interface needed to recognize a physical dimmer/switch from characterized Sensor metadata and to map member Sensor event sources to physical controls/gestures.
- Define a stable transient physical-device key strategy that is supplied by the model catalog/characterized metadata rather than display names.
- Update `package.json` `check:docs` to run `docs/validate_home_dashboard_docs_2.4.1.py` before the existing plan validator.

## Explicitly out of scope

- No production household dimmer model/event entry; that is Phase 07 after real characterization.
- No action/target presentation, screen/navigation work, Rule writes, structural changes, or generalized Hue graph object.
- No fuzzy name matching, `JSON.stringify(...).includes(...)`, or recursive graph-safety analysis.

## Expected repository changes

### Existing prerequisite files

- `src/protocol/hue/catalog/rules.ts`
- `src/protocol/hue/catalog/schedules.ts`
- `src/protocol/hue/resources/rules.ts`
- `src/app/types.ts`
- `src/ui/editors/SensorEditor.tsx`
- `package.json`
- `docs/validate_home_dashboard_docs_2.4.1.py`

### Expected new/modified outputs

#### Existing files expected to modify

- `package.json`
- `src/protocol/hue/index.ts`

#### New files expected to create

- `src/protocol/hue/dimmer/types.ts`
- `src/protocol/hue/dimmer/references.ts`
- `src/protocol/hue/dimmer/modelCatalog.ts`
- `test/protocol/hue/dimmer/references.test.ts`
- `test/protocol/hue/dimmer/identity.test.ts`
- `implementation_evidence/dimmer-2.4.1/phase-01.md`

## Required implementation behavior

- Exact resource identity is `(kind,id)`; same display name never merges resources.
- Authenticated Hue command paths may contain an API username segment, but parsed resource identity must not retain/display credential material.
- Malformed paths, unsupported kinds, unknown models, and ambiguous physical identity remain explicit non-editable results.
- The production catalog must remain empty or limited to already characterized evidence; do not guess the household dimmer model/event table.
- Keep the module pure: no React, AsyncStorage, networking, or ApplicationService mutation calls.

## Tests

- Unit-test exact parsing for Sensor condition paths, Light/Group actions, Scene activation form, Schedule command paths, Resource Links, authenticated path variants, URL-encoded IDs, and malformed paths.
- Test same-name Sensors/devices remain distinct and ambiguous identity is not guessed.
- Test no credential/API username survives in parsed display/provenance structures.
- Run existing Rule parser/catalog tests as regressions.

## Acceptance focus

- `AC-HUE-021`
- `AC-HUE-008`
- `AC-QA-003`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
python3 docs/validate_home_dashboard_docs_2.4.1.py docs
npm run typecheck
npm test -- --runInBand test/protocol/hue/dimmer/references.test.ts test/protocol/hue/dimmer/identity.test.ts test/protocol/hue/catalog/resourceCatalog.test.ts
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-01.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] 2.4.1 document validator passes and `package.json` points `check:docs` at it.
- [ ] Exact reference parsing and physical identity catalog interfaces exist with focused tests.
- [ ] No production household mapping was invented.
- [ ] All focused tests and typecheck pass.
- [ ] Phase evidence is persisted.
