# Phase 01 - Authoritative Legacy Visual Contract

Before implementation, read:

- `docs/legacy-awesome-button-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/legacy-awesome-button-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `src/tabs/common/Button.tsx`
- `src/tabs/common/Style.ts`
- `src/tabs/Lights.tsx`
- `99_PHASE_HANDOFF_TEMPLATE.md`

## Objective

Create an approved 2.2.0 SRS/SAD revision that makes the legacy dashboard button and dense-grid visual behavior authoritative without putting package/library choice into the SRS.

## Why this phase exists

The stakeholder has made visual fidelity to the old `ItemButton` behavior a material requirement. The current 2.1.0 SRS only requires operability and unknown-state treatment; it does not require the specific raised 3D button language. Implementation must not proceed on an undocumented visual requirement.

## Authoritative requirements

Existing affected requirements:

- FR-005
- FR-011
- FR-013
- QA-001
- QA-003

New 2.2.0 requirements to add:

- UX-VIS-001
- UX-VIS-002

## Relevant SAD sections

- `architectural_overview`
- `runtime_components`
- `repository_structure`
- UI/navigation architecture
- verification architecture

## In scope

- Add `UX-VIS-001`: normal dashboard resource controls reproduce the established legacy raised 3D animated button language, state-dependent Solarized color roles, retained Favorite/Edit bitmap controls, and full-tile question-mark unknown treatment.
- Add `UX-VIS-002`: normal configured resource collections use the established compact wrapping dashboard composition on supported Pixel 9 Pro portrait, with tile geometry derived from the legacy approximately-20%-of-window main button sizing rather than the current 160px card layout.
- Add objective acceptance criteria `AC-UX-VIS-001` and `AC-UX-VIS-002`.
- Clarify that dashboard tiles do not contain a destructive Delete affordance; Delete remains an editor/modal action.
- In the SAD, select a single `LegacyResourceButton` compatibility wrapper using `@rcaferati/react-native-awesome-button` as the intended production primitive, subject to the Phase 02 target compatibility gate.
- Define the old source files and screenshots as visual reference inputs, not production code to be reused wholesale.
- Update traceability and validator.
- Perform the normal baseline consistency/adversarial review before approving 2.2.0.

## Explicitly out of scope

- Installing the new package.
- Editing runtime UI components.
- Protocol/network fixes.
- Rewriting old tab/editor code.

## Expected repository changes

Existing inputs:

- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `docs/validate_home_dashboard_docs_2.1.0.py`

Expected outputs:

- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `docs/BASELINE_REVIEW_2.2.0.md`
- `docs/validate_home_dashboard_docs_2.2.0.py`
- `implementation_evidence/legacy-awesome-button/phase-01.md`

## Required implementation behavior

The SRS must define observable visual/interaction outcomes, not the npm package name. The SAD owns the package selection. The 2.2.0 SRS/SAD must not weaken existing resource semantics, deletion confirmation, accessibility, or Unknown-state behavior.

## Tests

- Run the 2.2.0 document validator.
- Mechanically verify no duplicate requirement/AC IDs.
- Verify all new requirements have traceability and SAD coverage.
- Adversarially check that the SAD does not require a custom clone in parallel with the selected package.

## Acceptance focus

Defines, but does not yet complete:

- AC-UX-VIS-001
- AC-UX-VIS-002
- AC-QA-001

## Commands/checks

```sh
python3 docs/validate_home_dashboard_docs_2.2.0.py
```

## Persisted implementation evidence

Create `implementation_evidence/legacy-awesome-button/phase-01.md`.

## Exit criteria

- [ ] SRS/SAD 2.2.0 exist and are mutually consistent.
- [ ] UX-VIS-001 and UX-VIS-002 are objectively testable.
- [ ] AwesomeButton package choice exists only in the SAD.
- [ ] 2.2.0 validator reports zero errors/warnings.
- [ ] Baseline review permits Phase 02.
- [ ] Evidence file is committed.
