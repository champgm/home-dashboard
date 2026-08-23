# Phase 20 — Scenes and Sensors UI

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 07, Phase 08, Phase 15, Phase 17, Phase 18

## Objective

Implement Scene and Sensor tabs/editors, Scene tap activation, per-light Scene editing, Sensor binary/configuration actions, and foreground search-status UI.

## Why this phase exists

Scenes and Sensors share no large policy model with Rules/Schedules but each adds one special interaction: Scene activation and bridge-owned search.

## Authoritative requirements

- `FR-009` (**PRIMARY OWNER**) — A normal tap on a reachable Scene shall activate that Scene.
- `FR-008` (supporting) — A normal tap on a reachable Light, Group, Plug, enabled/disabled Rule, enabled/disabled Schedule, or writable enabled/disabled Sensor shall toggle its applicable binary state using an absolute desired-state command derived from the current known state. If an automation contains a directly prohibited operation under HUE-016, Home Dashboard shall not enable it.
- `FR-010` (supporting) — A normal tap on a resource that has neither a Scene activation action nor an applicable binary state shall issue no device/bridge command.
- `FR-011` (supporting) — A resource whose current state is unknown shall display the established full-tile semi-transparent question-mark indication and shall not be represented as Off.
- `FR-012` (supporting) — A binary-state primary tap shall not be issued from an unknown state because the opposite state cannot be determined safely; explicit absolute actions may remain available in an editor where applicable.
- `FR-013` (supporting) — Editors shall expose the fields and operations required for the Hue V1 and TP-Link management requirements while preventing unsupported/read-only fields from being presented as writable.
- `HUE-006` (supporting) — The application shall provide applicable create/read/update/delete and activation operations for Hue Scenes supported by the deployed Hue V1 API, including GroupScene and LightScene forms and per-light scene state where the API supports it.
- `HUE-007` (supporting) — The application shall provide applicable create/read/update/delete, configuration, and search-for-new-sensors operations for Hue Sensors supported by the deployed Hue V1 API.
- `HUE-015` (supporting) — Hue search-for-new-lights and search-for-new-sensors shall be treated as bridge-owned foreground operations: before starting a search the application shall query the corresponding bridge search-status endpoint; if the bridge reports an active/recent search, that status shall be shown instead of blindly starting another. Local search polling shall stop outside the foreground and no process-durable local search journal is required.
- `QA-001` (supporting) — Primary navigation, Favorites, common toggles, Scene activation, editors, confirmation dialogs, and Advanced/Bridge shall be operable on both supported Pixel 9 Pro phones in portrait orientation without layout clipping that hides required controls.

## Relevant SAD sections

- `SAD_2.0.0.yaml:supported_resource_semantics.scene`
- `SAD_2.0.0.yaml:supported_resource_semantics.sensor`
- `SAD_2.0.0.yaml:hue_v1_design.scene_activation`
- `SAD_2.0.0.yaml:hue_v1_design.search`

## In scope

- Scene list/tile: normal reachable tap activates; non-reachable tap does not issue command.
- Scene editor for GroupScene/LightScene and supported per-light state.
- Sensor list/editor for supported writable configuration/binary enable behavior.
- Lights/Sensors search UI that checks status before POST, displays active/recent status, and stops local polling on background.
- CRUD/delete confirmation/Favorites integration.

## Explicitly out of scope

- Rules/Schedules UI
- Advanced provisioning

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/resources/scenes.ts
- src/protocol/hue/resources/sensors.ts
- src/protocol/hue/search.ts
- src/ui/components/
- `implementation_evidence/phase-07.md` (output of Phase 07)
- `implementation_evidence/phase-08.md` (output of Phase 08)
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-17.md` (output of Phase 17)
- `implementation_evidence/phase-18.md` (output of Phase 18)

### Expected outputs created or materially modified by this phase

- src/ui/screens/ScenesScreen.tsx
- src/ui/screens/SensorsScreen.tsx
- src/ui/editors/SceneEditor.tsx
- src/ui/editors/SensorEditor.tsx
- src/ui/components/HueSearchStatus.tsx
- test/ui/scenes/
- test/ui/sensors/
- implementation_evidence/phase-20.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Scene primary tap is activation, not an on/off toggle.
- Do not invent a primary action for a non-binary Sensor.
- Search state is not persisted locally.

## Tests

- GroupScene and LightScene activation UI wiring.
- Per-light Scene state editor serialization.
- Sensor writable/read-only control rendering.
- Search active -> no new POST; inactive -> explicit start; background stops status polling.
- Portrait layout smoke.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-20.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-008` — For each applicable resource type, verify known Off produces an absolute On request and known On produces an absolute Off/disabled request; verify a Rule/Schedule containing a directly prohibited action cannot be enabled.
- `AC-FR-009` — Tap characterized GroupScene and LightScene fixtures and verify the appropriate Hue activation command is emitted and bridge state is refreshed afterward.
- `AC-FR-010` — Tap read-only/non-binary resource tiles and verify the protocol adapters receive no mutation call.
- `AC-FR-011` — Force timeout/malformed-response states and verify the full-tile translucent question-mark treatment appears while Off styling does not.
- `AC-FR-012` — Mark a binary resource Unknown, tap its primary tile, and verify no toggle is sent; where an editor provides explicit On/Off, verify those absolute actions remain distinguishable.
- `AC-FR-013` — Using the documented Hue V1 resource catalog plus live fixtures, verify each supported field is editable/read-only as specified and unsupported fields cannot be submitted as writes.
- `AC-HUE-006` — Exercise GroupScene and LightScene create/read/update/activation/delete and per-light Scene state editing using documented V1 fixtures/disposable resources.
- `AC-HUE-007` — Exercise Sensor read/configuration/search and disposable create/update/delete for supported sensor forms using documented V1 fixtures/live bridge.
- `AC-HUE-015` — Simulate app restart/background during a bridge search, then foreground/start the search screen and verify status is queried before any new POST; verify no local durable search-intent record exists.
- `AC-QA-001` — Run visual/end-to-end layout tests on both phones at supported font/display settings and verify all required controls remain reachable.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/scenes test/ui/sensors
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-20.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-20.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
