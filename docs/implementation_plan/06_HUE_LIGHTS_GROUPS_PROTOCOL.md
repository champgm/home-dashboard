# Phase 06 — Hue Lights and Groups Protocol

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 04, Phase 05

## Objective

Implement fixture-backed/documented V1 Light and Group read/mutation/create/delete/control serializers behind HueV1Adapter, without UI.

## Why this phase exists

Lights and Groups share on/off/brightness/group-action semantics and pacing but do not require the more complex Scene/Sensor/automation models.

## Authoritative requirements

- `HUE-004` (**PRIMARY OWNER**) — The application shall provide applicable create/read/update/delete, state-control, and search-for-new-lights operations for Hue Lights supported by the deployed Hue V1 API, with destructive actions subject to UX-DEL-001..003.
- `HUE-005` (**PRIMARY OWNER**) — The application shall provide applicable create/read/update/delete and group-action operations for Hue Groups supported by the deployed Hue V1 API, with destructive actions subject to UX-DEL-001..003.
- `HUE-013` (supporting) — The application shall interpret Hue V1 JSON success/error responses per operation and shall not report an operation as wholly successful when the response contains an applicable error.
- `HUE-014` (supporting) — The application shall enforce at least 100 ms between dispatches of Hue individual-Light state writes and at least 1,000 ms between dispatches of Hue Group action writes, including Scene activation.
- `HUE-020` (supporting) — When updating an existing Hue resource, the application shall send only fields intentionally changed by the user or required by that specific API operation and shall not rewrite unrelated fields merely because the resource was opened/saved. In particular, unchanged Schedule commands shall not be rewritten or rebound. The Schedule editor shall provide an explicit user action to rebuild an editable command address using the current Home Dashboard credential without exposing the credential, for manual recovery after reauthorization when needed.
- `FR-016` (supporting) — If a reachable Hue Group reports a valid indeterminate aggregate on/off state, a normal primary tap shall issue an absolute On group action.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.full_management_strategy`
- `SAD_2.0.0.yaml:supported_resource_semantics.light`
- `SAD_2.0.0.yaml:supported_resource_semantics.group`
- `SAD_2.0.0.yaml:internal_domain_interfaces.services.HueV1Adapter`

## In scope

- Implement documented/deployed Light writable fields, explicit absolute state operations, search result access hooks, and applicable delete behavior.
- Implement Group create/read/update/delete and group action payloads.
- Implement changed-field-only update serializers.
- Represent Group aggregate on/off including indeterminate states for ApplicationService later.

## Explicitly out of scope

- Scene activation
- Sensor search logic
- UI/editors
- Delete confirmation UX

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/HueV1Adapter.ts
- test/fixtures/characterization/
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)

### Expected outputs created or materially modified by this phase

- src/protocol/hue/resources/lights.ts
- src/protocol/hue/resources/groups.ts
- test/protocol/hue/lights/
- test/protocol/hue/groups/
- implementation_evidence/phase-06.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Use absolute desired state; do not define UI toggle by blind inversion in the adapter.
- Updates emit only intentionally changed/operation-required fields.
- All group actions use the Group pacing channel.
- Do not add bridge-admin operations.

## Tests

- Characterized Light/Group reads.
- CRUD request/response serialization including explicit errors/partial failures.
- Changed-field-only update tests.
- Group aggregate on/off state examples including indeterminate.
- Pacing integration with transport fake clock.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-06.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-016` — Provide a Group fixture with a valid mixed/indeterminate aggregate state and verify the primary tap emits an absolute On action.
- `AC-HUE-004` — Exercise documented Light read/update/state/search operations against fixtures/live bridge and verify delete behavior against an isolated disposable/test fixture without deleting a household light.
- `AC-HUE-005` — Create a disposable Group, read it, update membership/name, issue group action, delete it, and verify bridge responses.
- `AC-HUE-013` — Feed success, error, and mixed Hue response arrays and verify success/partial-failure/failure classification matches each operation entry.
- `AC-HUE-014` — Using a monotonic fake clock, issue repeated eligible commands and verify Light dispatches are separated by >=100 ms and Group/Scene action dispatches by >=1,000 ms.
- `AC-HUE-020` — Open/save unchanged resources and inspect requests for omitted unchanged fields; edit one field and verify unrelated Schedule command/address data is preserved by omission; invoke the explicit Schedule command-authorization rebuild action and verify only then is the command address rebuilt with the current credential, without displaying the credential.

## Acceptance completion note

`AC-HUE-004` Light search is supplied by Phase 08 and the end-user/editor portions close in Phase 19/20/27. Treat this phase as protocol completion, not full criterion closure.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/lights test/protocol/hue/groups
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-06.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-06.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
