# Phase 11 — Hue Action Policy and Partial-Update Enforcement

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 09, Phase 10

## Objective

Implement the immediate-operation HueActionPolicy and shared changed-field serialization guardrails used by Rule/Schedule editors, including safe handling of existing directly prohibited automations.

## Why this phase exists

Policy is security/scope logic shared by two already-implemented catalogs. Isolating it lets an LLM reason about one allow/deny matrix without also building the resource models.

## Authoritative requirements

- `HUE-016` (**PRIMARY OWNER**) — Rule actions and Schedule commands authored or edited by Home Dashboard shall be constructed through structured controls and validated at save time so the immediate operation does not target bridge Configuration/Capabilities, API-user provisioning, firmware/update/reset/network administration, or a resource DELETE. Home Dashboard shall not expose an arbitrary raw Hue method/address/body editor. Recursive/transitive future-safety analysis of other Rules/Schedules is not required.
- `HUE-020` (**PRIMARY OWNER**) — When updating an existing Hue resource, the application shall send only fields intentionally changed by the user or required by that specific API operation and shall not rewrite unrelated fields merely because the resource was opened/saved. In particular, unchanged Schedule commands shall not be rewritten or rebound. The Schedule editor shall provide an explicit user action to rebuild an editable command address using the current Home Dashboard credential without exposing the credential, for manual recovery after reauthorization when needed.
- `HUE-011` (supporting) — Hue Bridge Configuration and Capabilities shall be inspectable but shall not be directly editable by Home Dashboard. Home Dashboard shall not directly author or enable a Rule/Schedule whose own immediate embedded operation writes bridge Configuration/Capabilities or other bridge administration; link-button credential creation and same-bridge reauthorization are the only required bridge-administration writes. Recursive effects through other pre-existing automations are outside this requirement under DG-005.
- `FR-008` (supporting) — A normal tap on a reachable Light, Group, Plug, enabled/disabled Rule, enabled/disabled Schedule, or writable enabled/disabled Sensor shall toggle its applicable binary state using an absolute desired-state command derived from the current known state. If an automation contains a directly prohibited operation under HUE-016, Home Dashboard shall not enable it.
- `FR-013` (supporting) — Editors shall expose the fields and operations required for the Hue V1 and TP-Link management requirements while preventing unsupported/read-only fields from being presented as writable.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.embedded_action_policy`
- `SAD_2.0.0.yaml:hue_v1_design.partial_updates`
- `SAD_2.0.0.yaml:supported_resource_semantics.rule`

## In scope

- Implement `validateImmediateAction(method,path,body)` against structured operations.
- Deny direct writes to bridge config/capabilities, API-user provisioning, firmware/reset/network administration, and any resource DELETE.
- Permit supported non-bridge operations per the SRS without recursive/transitive graph analysis.
- Classify existing automations with directly prohibited own operations as inspectable/disableable/deleteable but not enableable until edited to allowed immediate action.
- Add shared tests that update payloads contain only edited/operation-required fields.

## Explicitly out of scope

- Recursive future automation graph analysis
- Raw JSON/action editor
- Rule/Schedule screen implementation

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/catalog/rules.ts
- src/protocol/hue/catalog/schedules.ts
- `implementation_evidence/phase-09.md` (output of Phase 09)
- `implementation_evidence/phase-10.md` (output of Phase 10)

### Expected outputs created or materially modified by this phase

- src/protocol/hue/HueActionPolicy.ts
- src/protocol/hue/changedFields.ts
- test/protocol/hue/actionPolicy/
- implementation_evidence/phase-11.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Do not reintroduce the rejected recursive theorem-proving design.
- Validation applies to the immediate authored operation only.
- No arbitrary raw address/method/body escape hatch.

## Tests

- Allow/deny matrix for every documented editor action family.
- Direct bridge-admin and DELETE targets are denied.
- Existing prohibited automation can be disabled/deleted but not enabled unchanged.
- Changed-field property tests for Rule/Schedule updates.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-11.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-008` — For each applicable resource type, verify known Off produces an absolute On request and known On produces an absolute Off/disabled request; verify a Rule/Schedule containing a directly prohibited action cannot be enabled.
- `AC-FR-013` — Using the documented Hue V1 resource catalog plus live fixtures, verify each supported field is editable/read-only as specified and unsupported fields cannot be submitted as writes.
- `AC-HUE-011` — Verify Configuration/Capabilities render read-only, no generic bridge-config write control exists, and a Rule/Schedule whose own immediate action writes bridge administration cannot be authored/enabled; direct app protocol traces contain no bridge-config mutation except create-user during provisioning/reauthorization.
- `AC-HUE-016` — Attempt direct prohibited bridge/admin/delete operations and verify they cannot be authored; verify permitted structured resource operations can be saved; verify the implementation performs no recursive graph-safety requirement beyond validating the immediate authored operation.
- `AC-HUE-020` — Open/save unchanged resources and inspect requests for omitted unchanged fields; edit one field and verify unrelated Schedule command/address data is preserved by omission; invoke the explicit Schedule command-authorization rebuild action and verify only then is the command address rebuilt with the current credential, without displaying the credential.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/actionPolicy
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-11.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-11.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
