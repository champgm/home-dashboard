# Phase 07 — Hue Scenes Protocol

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 04, Phase 05, Phase 06

## Objective

Implement GroupScene and LightScene management, per-light scene state, and activation request generation behind the Hue adapter.

## Why this phase exists

Scene forms and per-light state are a distinct model, and activation has special GroupScene versus LightScene routing that should be proven independently.

## Authoritative requirements

- `HUE-006` (**PRIMARY OWNER**) — The application shall provide applicable create/read/update/delete and activation operations for Hue Scenes supported by the deployed Hue V1 API, including GroupScene and LightScene forms and per-light scene state where the API supports it.
- `HUE-014` (supporting) — The application shall enforce at least 100 ms between dispatches of Hue individual-Light state writes and at least 1,000 ms between dispatches of Hue Group action writes, including Scene activation.
- `HUE-020` (supporting) — When updating an existing Hue resource, the application shall send only fields intentionally changed by the user or required by that specific API operation and shall not rewrite unrelated fields merely because the resource was opened/saved. In particular, unchanged Schedule commands shall not be rewritten or rebound. The Schedule editor shall provide an explicit user action to rebuild an editable command address using the current Home Dashboard credential without exposing the credential, for manual recovery after reauthorization when needed.
- `FR-009` (supporting) — A normal tap on a reachable Scene shall activate that Scene.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.scene_activation`
- `SAD_2.0.0.yaml:hue_v1_design.full_management_strategy`
- `SAD_2.0.0.yaml:supported_resource_semantics.scene`

## In scope

- Implement Scene create/read/update/delete models for documented/deployed forms.
- Implement per-light Scene state where Hue V1 supports it.
- Implement GroupScene activation through its stored group and LightScene activation through group 0 exactly as the SAD specifies.
- Use Group action pacing for activation.

## Explicitly out of scope

- Scene tile/editor rendering
- Rules/Schedules that reference Scenes

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/HueV1Adapter.ts
- test/fixtures/characterization/
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)
- `implementation_evidence/phase-06.md` (output of Phase 06)

### Expected outputs created or materially modified by this phase

- src/protocol/hue/resources/scenes.ts
- test/protocol/hue/scenes/
- implementation_evidence/phase-07.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Do not infer a group field for LightScene; activation uses group 0.
- Preserve read-only/unknown Scene fields while writing only catalog-approved changed fields.

## Tests

- Characterized 49 LightScene / 39 GroupScene fixture coverage if those counts remain in the retained baseline fixtures.
- Activation path tests for both Scene types.
- Per-light Scene state serialization round-trip tests.
- CRUD/error fixtures.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-07.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-009` — Tap characterized GroupScene and LightScene fixtures and verify the appropriate Hue activation command is emitted and bridge state is refreshed afterward.
- `AC-HUE-006` — Exercise GroupScene and LightScene create/read/update/activation/delete and per-light Scene state editing using documented V1 fixtures/disposable resources.
- `AC-HUE-014` — Using a monotonic fake clock, issue repeated eligible commands and verify Light dispatches are separated by >=100 ms and Group/Scene action dispatches by >=1,000 ms.
- `AC-HUE-020` — Open/save unchanged resources and inspect requests for omitted unchanged fields; edit one field and verify unrelated Schedule command/address data is preserved by omission; invoke the explicit Schedule command-authorization rebuild action and verify only then is the command address rebuilt with the current credential, without displaying the credential.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/scenes
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-07.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

At minimum record:

- work completed;
- primary/supporting requirement IDs;
- tests/checks and actual results;
- acceptance criteria exercised;
- materially changed files;
- known limitations;
- target-dependent checks not yet performed;
- deviations or discovered SRS/SAD problems;
- handoff notes.

## Exit criteria

- [ ] Every in-scope implementation item exists and follows the listed SAD sections.
- [ ] All non-target-gated tests/checks required by this phase pass.
- [ ] Every target-gated item is either passed with evidence or explicitly recorded `PENDING TARGET` where this phase permits deferral.
- [ ] `implementation_evidence/phase-07.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
