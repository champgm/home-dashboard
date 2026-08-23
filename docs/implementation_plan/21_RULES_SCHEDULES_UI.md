# Phase 21 — Rules and Schedules UI

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 09, Phase 10, Phase 11, Phase 15, Phase 17, Phase 18

## Objective

Implement structured Rule and Schedule editors for the full catalog, including policy diagnostics, enable/disable behavior, changed-field updates, and explicit Schedule command-authorization rebuild.

## Why this phase exists

Automation editors have the largest UI reasoning set, so they are isolated from simpler Hue resources and provisioning.

## Authoritative requirements

- `FR-008` (supporting) — A normal tap on a reachable Light, Group, Plug, enabled/disabled Rule, enabled/disabled Schedule, or writable enabled/disabled Sensor shall toggle its applicable binary state using an absolute desired-state command derived from the current known state. If an automation contains a directly prohibited operation under HUE-016, Home Dashboard shall not enable it.
- `FR-010` (supporting) — A normal tap on a resource that has neither a Scene activation action nor an applicable binary state shall issue no device/bridge command.
- `FR-013` (supporting) — Editors shall expose the fields and operations required for the Hue V1 and TP-Link management requirements while preventing unsupported/read-only fields from being presented as writable.
- `HUE-008` (supporting) — The application shall provide applicable create/read/update/delete and enable/disable operations for Hue Rules supported by the deployed Hue V1 API, including documented V1 condition/operator and action forms that are permitted by HUE-016.
- `HUE-009` (supporting) — The application shall provide applicable create/read/update/delete and enable/disable operations for Hue Schedules supported by the deployed Hue V1 API, including documented V1 time-pattern forms and commands permitted by HUE-016.
- `HUE-016` (supporting) — Rule actions and Schedule commands authored or edited by Home Dashboard shall be constructed through structured controls and validated at save time so the immediate operation does not target bridge Configuration/Capabilities, API-user provisioning, firmware/update/reset/network administration, or a resource DELETE. Home Dashboard shall not expose an arbitrary raw Hue method/address/body editor. Recursive/transitive future-safety analysis of other Rules/Schedules is not required.
- `HUE-020` (supporting) — When updating an existing Hue resource, the application shall send only fields intentionally changed by the user or required by that specific API operation and shall not rewrite unrelated fields merely because the resource was opened/saved. In particular, unchanged Schedule commands shall not be rewritten or rebound. The Schedule editor shall provide an explicit user action to rebuild an editable command address using the current Home Dashboard credential without exposing the credential, for manual recovery after reauthorization when needed.
- `QA-001` (supporting) — Primary navigation, Favorites, common toggles, Scene activation, editors, confirmation dialogs, and Advanced/Bridge shall be operable on both supported Pixel 9 Pro phones in portrait orientation without layout clipping that hides required controls.

## Relevant SAD sections

- `SAD_2.0.0.yaml:supported_resource_semantics.rule`
- `SAD_2.0.0.yaml:supported_resource_semantics.schedule`
- `SAD_2.0.0.yaml:hue_v1_design.embedded_action_policy`
- `SAD_2.0.0.yaml:hue_v1_design.partial_updates`

## In scope

- Rule list/editor for documented condition/operator/action catalog; structured action builder only.
- Schedule list/editor for documented time patterns and structured commands.
- Save-time HueActionPolicy validation with actionable denial reason.
- Existing directly prohibited automation remains inspectable/disableable/deleteable but cannot be enabled unchanged.
- Explicit Schedule `Rebuild command authorization` action uses current credential internally and never displays it.
- Changed-field-only update behavior.
- Delete confirmation and Favorites integration where meaningful.

## Explicitly out of scope

- Recursive/transitive automation graph analysis
- Raw Hue JSON/method/address/body editor
- Hue credential reauthorization itself

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/catalog/rules.ts
- src/protocol/hue/catalog/schedules.ts
- src/protocol/hue/HueActionPolicy.ts
- src/ui/components/
- `implementation_evidence/phase-09.md` (output of Phase 09)
- `implementation_evidence/phase-10.md` (output of Phase 10)
- `implementation_evidence/phase-11.md` (output of Phase 11)
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-17.md` (output of Phase 17)
- `implementation_evidence/phase-18.md` (output of Phase 18)

### Expected outputs created or materially modified by this phase

- src/ui/screens/RulesScreen.tsx
- src/ui/screens/SchedulesScreen.tsx
- src/ui/editors/RuleEditor.tsx
- src/ui/editors/ScheduleEditor.tsx
- src/ui/editors/automation/
- test/ui/rules/
- test/ui/schedules/
- implementation_evidence/phase-21.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Do not silently narrow editors to only currently deployed fixture forms.
- Do not expose credential-bearing Schedule paths.
- Unchanged command is not rebound on ordinary save.

## Tests

- Representative documented Rule operators/action families through UI -> structured domain -> serializer.
- Schedule time-pattern families through UI.
- Policy deny/disable-only existing prohibited automation behavior.
- Unrelated Schedule edit proves embedded command authorization unchanged.
- Explicit rebuild action produces current-credential command internally without rendered credential.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-21.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-008` — For each applicable resource type, verify known Off produces an absolute On request and known On produces an absolute Off/disabled request; verify a Rule/Schedule containing a directly prohibited action cannot be enabled.
- `AC-FR-010` — Tap read-only/non-binary resource tiles and verify the protocol adapters receive no mutation call.
- `AC-FR-013` — Using the documented Hue V1 resource catalog plus live fixtures, verify each supported field is editable/read-only as specified and unsupported fields cannot be submitted as writes.
- `AC-HUE-008` — Round-trip documented Hue V1 Rule condition/operator families and permitted action families through parser/editor/serializer tests, then create/update/enable/disable/delete a disposable Rule.
- `AC-HUE-009` — Round-trip documented Hue V1 Schedule time-pattern and permitted command families through parser/editor/serializer tests, then create/update/enable/disable/delete a disposable Schedule.
- `AC-HUE-016` — Attempt direct prohibited bridge/admin/delete operations and verify they cannot be authored; verify permitted structured resource operations can be saved; verify the implementation performs no recursive graph-safety requirement beyond validating the immediate authored operation.
- `AC-HUE-020` — Open/save unchanged resources and inspect requests for omitted unchanged fields; edit one field and verify unrelated Schedule command/address data is preserved by omission; invoke the explicit Schedule command-authorization rebuild action and verify only then is the command address rebuilt with the current credential, without displaying the credential.
- `AC-QA-001` — Run visual/end-to-end layout tests on both phones at supported font/display settings and verify all required controls remain reachable.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/rules test/ui/schedules
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-21.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-21.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
