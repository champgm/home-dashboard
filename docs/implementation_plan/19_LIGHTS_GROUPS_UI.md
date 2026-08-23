# Phase 19 — Lights and Groups UI

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 06, Phase 15, Phase 17, Phase 18

## Objective

Replace legacy Lights/Groups runtime screens with modern list/tile/editor flows wired exclusively through ApplicationService and the validated Hue resource catalog.

## Why this phase exists

Lights and Groups form the simplest full CRUD/control UI slice and provide the first complete Hue user workflow before more complex editors.

## Authoritative requirements

- `FR-008` (supporting) — A normal tap on a reachable Light, Group, Plug, enabled/disabled Rule, enabled/disabled Schedule, or writable enabled/disabled Sensor shall toggle its applicable binary state using an absolute desired-state command derived from the current known state. If an automation contains a directly prohibited operation under HUE-016, Home Dashboard shall not enable it.
- `FR-011` (supporting) — A resource whose current state is unknown shall display the established full-tile semi-transparent question-mark indication and shall not be represented as Off.
- `FR-012` (supporting) — A binary-state primary tap shall not be issued from an unknown state because the opposite state cannot be determined safely; explicit absolute actions may remain available in an editor where applicable.
- `FR-013` (supporting) — Editors shall expose the fields and operations required for the Hue V1 and TP-Link management requirements while preventing unsupported/read-only fields from being presented as writable.
- `FR-016` (supporting) — If a reachable Hue Group reports a valid indeterminate aggregate on/off state, a normal primary tap shall issue an absolute On group action.
- `HUE-004` (supporting) — The application shall provide applicable create/read/update/delete, state-control, and search-for-new-lights operations for Hue Lights supported by the deployed Hue V1 API, with destructive actions subject to UX-DEL-001..003.
- `HUE-005` (supporting) — The application shall provide applicable create/read/update/delete and group-action operations for Hue Groups supported by the deployed Hue V1 API, with destructive actions subject to UX-DEL-001..003.
- `UX-DEL-001` (supporting) — Before issuing any Hue resource deletion or local plug-endpoint removal, the application shall present a single explicit confirmation dialog identifying the object and consequence.
- `UX-DEL-002` (supporting) — Opening the confirmation dialog shall not issue the destructive operation; the operation shall require a second deliberate press on the dialog Confirm control.
- `UX-DEL-003` (supporting) — The destructive Confirm control shall be presented in a modal action area visually separated from the originating Delete control; while the dialog is displayed the originating Delete control shall be non-interactive and Cancel shall remain available.
- `QA-001` (supporting) — Primary navigation, Favorites, common toggles, Scene activation, editors, confirmation dialogs, and Advanced/Bridge shall be operable on both supported Pixel 9 Pro phones in portrait orientation without layout clipping that hides required controls.

## Relevant SAD sections

- `SAD_2.0.0.yaml:supported_resource_semantics.light`
- `SAD_2.0.0.yaml:supported_resource_semantics.group`
- `SAD_2.0.0.yaml:repository_structure.root`
- `SAD_2.0.0.yaml:selected_platform.navigation`

## In scope

- Lights and Groups tabs using shared tiles.
- Known-state primary toggles through ApplicationService; Unknown tap suppressed; Group indeterminate -> On.
- Editors for all catalog-supported writable fields and explicit absolute actions.
- Create/update/delete flows with shared confirmation.
- Favorite affordance using shared Favorites service.
- Remove corresponding legacy runtime imports once feature parity is verified.

## Explicitly out of scope

- Scenes/Sensors/Rules/Schedules UI
- Provisioning/Advanced

## Expected repository changes

### Existing prerequisite files/directories

- src/ui/components/ResourceTile.tsx
- src/protocol/hue/resources/lights.ts
- src/protocol/hue/resources/groups.ts
- src/app/ApplicationService.ts
- `implementation_evidence/phase-06.md` (output of Phase 06)
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-17.md` (output of Phase 17)
- `implementation_evidence/phase-18.md` (output of Phase 18)

### Expected outputs created or materially modified by this phase

- src/ui/screens/LightsScreen.tsx
- src/ui/screens/GroupsScreen.tsx
- src/ui/editors/LightEditor.tsx
- src/ui/editors/GroupEditor.tsx
- test/ui/lights/
- test/ui/groups/
- implementation_evidence/phase-19.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- UI never calls HueV1Adapter directly.
- Read-only/unsupported fields are not rendered as writable controls.
- Delete buttons always use the Phase 18 confirmation API.

## Tests

- Component integration tests for known/unknown toggle behavior.
- Group indeterminate primary tap.
- Create/update/delete editor payload wiring.
- Portrait layout smoke at Pixel 9 Pro logical dimensions.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-19.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-008` — For each applicable resource type, verify known Off produces an absolute On request and known On produces an absolute Off/disabled request; verify a Rule/Schedule containing a directly prohibited action cannot be enabled.
- `AC-FR-011` — Force timeout/malformed-response states and verify the full-tile translucent question-mark treatment appears while Off styling does not.
- `AC-FR-012` — Mark a binary resource Unknown, tap its primary tile, and verify no toggle is sent; where an editor provides explicit On/Off, verify those absolute actions remain distinguishable.
- `AC-FR-013` — Using the documented Hue V1 resource catalog plus live fixtures, verify each supported field is editable/read-only as specified and unsupported fields cannot be submitted as writes.
- `AC-FR-016` — Provide a Group fixture with a valid mixed/indeterminate aggregate state and verify the primary tap emits an absolute On action.
- `AC-HUE-004` — Exercise documented Light read/update/state/search operations against fixtures/live bridge and verify delete behavior against an isolated disposable/test fixture without deleting a household light.
- `AC-HUE-005` — Create a disposable Group, read it, update membership/name, issue group action, delete it, and verify bridge responses.
- `AC-UX-DEL-001` — Trigger Delete for each supported deletable type and verify a modal names the target and consequence before any destructive adapter call occurs.
- `AC-UX-DEL-002` — Open and cancel the dialog and verify zero destructive calls; reopen and confirm and verify exactly one destructive call.
- `AC-UX-DEL-003` — Inspect/render the dialog on Pixel 9 Pro portrait and verify spatial separation, disabled originating control, and functional Cancel.
- `AC-QA-001` — Run visual/end-to-end layout tests on both phones at supported font/display settings and verify all required controls remain reachable.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/lights test/ui/groups
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-19.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-19.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
