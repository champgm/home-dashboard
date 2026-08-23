# Phase 10 — Hue Schedules Protocol and Catalog

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 04, Phase 05

## Objective

Implement documented Hue V1 Schedule time-pattern/command forms, CRUD/enable-disable serialization, and preservation of embedded command authorization on unrelated updates.

## Why this phase exists

Schedule time patterns and credential-bearing embedded commands form a coherent complex subsystem that should be finished before UI or reauthorization repair flows.

## Authoritative requirements

- `HUE-009` (**PRIMARY OWNER**) — The application shall provide applicable create/read/update/delete and enable/disable operations for Hue Schedules supported by the deployed Hue V1 API, including documented V1 time-pattern forms and commands permitted by HUE-016.
- `HUE-016` (supporting) — Rule actions and Schedule commands authored or edited by Home Dashboard shall be constructed through structured controls and validated at save time so the immediate operation does not target bridge Configuration/Capabilities, API-user provisioning, firmware/update/reset/network administration, or a resource DELETE. Home Dashboard shall not expose an arbitrary raw Hue method/address/body editor. Recursive/transitive future-safety analysis of other Rules/Schedules is not required.
- `HUE-020` (supporting) — When updating an existing Hue resource, the application shall send only fields intentionally changed by the user or required by that specific API operation and shall not rewrite unrelated fields merely because the resource was opened/saved. In particular, unchanged Schedule commands shall not be rewritten or rebound. The Schedule editor shall provide an explicit user action to rebuild an editable command address using the current Home Dashboard credential without exposing the credential, for manual recovery after reauthorization when needed.
- `FR-008` (supporting) — A normal tap on a reachable Light, Group, Plug, enabled/disabled Rule, enabled/disabled Schedule, or writable enabled/disabled Sensor shall toggle its applicable binary state using an absolute desired-state command derived from the current known state. If an automation contains a directly prohibited operation under HUE-016, Home Dashboard shall not enable it.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.full_management_strategy`
- `SAD_2.0.0.yaml:supported_resource_semantics.schedule`
- `SAD_2.0.0.yaml:hue_v1_design.partial_updates`

## In scope

- Implement Schedule models and documented V1 time-pattern forms required by full_management.
- Implement structured Schedule command target/method/body representation.
- Implement create/read/update/delete and enable/disable operations.
- Implement changed-field-only updates that leave unchanged command address/body untouched.
- Provide pure function that can rebuild a structured editable command using a supplied current credential without exposing it in view models.

## Explicitly out of scope

- Schedule editor UI
- Same-bridge reauthorization workflow
- Immediate action policy enforcement (Phase 11)

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/HueV1Adapter.ts
- test/fixtures/characterization/
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)

### Expected outputs created or materially modified by this phase

- src/protocol/hue/catalog/schedules.ts
- src/protocol/hue/resources/schedules.ts
- test/protocol/hue/schedules/
- implementation_evidence/phase-10.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Unrelated Schedule saves must not rewrite embedded authorization paths.
- Credential-bearing command paths never enter ordinary display/log DTOs.
- Do not automatically rebind commands after reauthorization.

## Tests

- All characterized Schedule fixtures parse.
- Documented time-pattern form tests.
- Unrelated field update leaves command bytes/structure unchanged.
- Explicit rebuild helper changes only credential-bearing authorization component while preserving structured target semantics.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-10.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-008` — For each applicable resource type, verify known Off produces an absolute On request and known On produces an absolute Off/disabled request; verify a Rule/Schedule containing a directly prohibited action cannot be enabled.
- `AC-HUE-009` — Round-trip documented Hue V1 Schedule time-pattern and permitted command families through parser/editor/serializer tests, then create/update/enable/disable/delete a disposable Schedule.
- `AC-HUE-016` — Attempt direct prohibited bridge/admin/delete operations and verify they cannot be authored; verify permitted structured resource operations can be saved; verify the implementation performs no recursive graph-safety requirement beyond validating the immediate authored operation.
- `AC-HUE-020` — Open/save unchanged resources and inspect requests for omitted unchanged fields; edit one field and verify unrelated Schedule command/address data is preserved by omission; invoke the explicit Schedule command-authorization rebuild action and verify only then is the command address rebuilt with the current credential, without displaying the credential.

## Acceptance completion note

`AC-HUE-009` parser/serializer CRUD portions are completed here; structured editor round-trip and live disposable Schedule verification close in Phase 21/27.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/schedules
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-10.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-10.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
