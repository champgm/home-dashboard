# Phase 18 — Destructive Action Confirmation and Cleanup

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 02, Phase 15, Phase 17

## Objective

Provide one reusable destructive-action flow for Hue resource deletion and local plug-endpoint removal, including explicit confirmation and best-effort Favorite cleanup without durable delete journals or automatic retries.

## Why this phase exists

Delete safety is cross-resource and should be correct before individual editors expose Delete buttons.

## Authoritative requirements

- `FR-014` (**PRIMARY OWNER**) — After this phone definitively deletes a Hue resource or removes a plug endpoint, the application shall attempt to remove any matching Favorite reference on the same phone. Failure to persist that Favorite cleanup shall not cause a second remote DELETE; a stale Favorite may remain and is handled by FR-015.
- `REL-004` (**PRIMARY OWNER**) — Create and delete operations shall not be automatically repeated after an ambiguous outcome. After background/process loss, ordinary authoritative refresh plus user action is the recovery mechanism; no process-durable remote-operation journal is required.
- `UX-DEL-001` (**PRIMARY OWNER**) — Before issuing any Hue resource deletion or local plug-endpoint removal, the application shall present a single explicit confirmation dialog identifying the object and consequence.
- `UX-DEL-002` (**PRIMARY OWNER**) — Opening the confirmation dialog shall not issue the destructive operation; the operation shall require a second deliberate press on the dialog Confirm control.
- `UX-DEL-003` (**PRIMARY OWNER**) — The destructive Confirm control shall be presented in a modal action area visually separated from the originating Delete control; while the dialog is displayed the originating Delete control shall be non-interactive and Cancel shall remain available.
- `FR-015` (supporting) — If a Favorite references a resource or plug endpoint that no longer resolves, the Favorite shall be shown as missing/unknown, shall issue no primary command, and shall remain removable by the user.
- `HUE-004` (supporting) — The application shall provide applicable create/read/update/delete, state-control, and search-for-new-lights operations for Hue Lights supported by the deployed Hue V1 API, with destructive actions subject to UX-DEL-001..003.
- `HUE-005` (supporting) — The application shall provide applicable create/read/update/delete and group-action operations for Hue Groups supported by the deployed Hue V1 API, with destructive actions subject to UX-DEL-001..003.
- `HUE-006` (supporting) — The application shall provide applicable create/read/update/delete and activation operations for Hue Scenes supported by the deployed Hue V1 API, including GroupScene and LightScene forms and per-light scene state where the API supports it.
- `HUE-007` (supporting) — The application shall provide applicable create/read/update/delete, configuration, and search-for-new-sensors operations for Hue Sensors supported by the deployed Hue V1 API.
- `HUE-008` (supporting) — The application shall provide applicable create/read/update/delete and enable/disable operations for Hue Rules supported by the deployed Hue V1 API, including documented V1 condition/operator and action forms that are permitted by HUE-016.
- `HUE-009` (supporting) — The application shall provide applicable create/read/update/delete and enable/disable operations for Hue Schedules supported by the deployed Hue V1 API, including documented V1 time-pattern forms and commands permitted by HUE-016.
- `HUE-010` (supporting) — The application shall provide applicable create/read/update/delete operations for Hue Resource Links supported by the deployed Hue V1 API.
- `TPL-010` (supporting) — Removing a plug endpoint shall remove only the local endpoint record and shall not factory-reset, reboot, unpair, or otherwise reconfigure the physical plug.

## Relevant SAD sections

- `SAD_2.0.0.yaml:architectural_decisions`
- `SAD_2.0.0.yaml:persistence_architecture.remote_operation_recovery`
- `SAD_2.0.0.yaml:supported_resource_semantics.favorites`

## In scope

- Implement reusable confirmation modal API requiring object name/type and consequence text.
- Originating Delete control becomes non-interactive while modal is open; Cancel remains available; Confirm lives in separate modal action area.
- Only Confirm invokes the supplied destructive callback.
- Definite successful Hue delete or local plug removal triggers one best-effort same-phone Favorite cleanup attempt.
- Ambiguous Hue delete is not repeated and does not pretend success; refresh/manual action resolves later.
- Favorite cleanup persistence failure never triggers another remote DELETE.

## Explicitly out of scope

- Resource editor layout except integrating the shared delete control later
- Deletion journals/tombstones

## Expected repository changes

### Existing prerequisite files/directories

- src/ui/components/
- src/app/ApplicationService.ts
- src/storage/ConfigStore.ts
- `implementation_evidence/phase-02.md` (output of Phase 02)
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-17.md` (output of Phase 17)

### Expected outputs created or materially modified by this phase

- src/ui/components/ConfirmDestructiveAction.tsx
- src/app/destructiveActions.ts
- test/ui/destructive/
- test/app/destructive/
- implementation_evidence/phase-18.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Opening modal performs zero destructive I/O.
- No automatic retry after ambiguous remote delete.
- Stale Favorite is acceptable and handled by Missing state.

## Tests

- Modal open/cancel/confirm event tests with exact one callback on Confirm.
- Origin Delete disabled while modal visible and controls spatially separated by modal structure.
- Definite delete -> Favorite cleanup.
- Favorite cleanup storage failure -> no second remote DELETE.
- Ambiguous delete -> no auto retry.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-18.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-014` — Inject local persistence failure after a successful remote delete; verify the remote delete is not repeated, a stale Favorite may remain, and it subsequently renders Missing/Unknown rather than issuing a command.
- `AC-FR-015` — Delete/remove the target externally, refresh, verify the Favorite becomes Missing/Unknown, emits no command on tap, and can be manually removed.
- `AC-HUE-004` — Exercise documented Light read/update/state/search operations against fixtures/live bridge and verify delete behavior against an isolated disposable/test fixture without deleting a household light.
- `AC-HUE-005` — Create a disposable Group, read it, update membership/name, issue group action, delete it, and verify bridge responses.
- `AC-HUE-006` — Exercise GroupScene and LightScene create/read/update/activation/delete and per-light Scene state editing using documented V1 fixtures/disposable resources.
- `AC-HUE-007` — Exercise Sensor read/configuration/search and disposable create/update/delete for supported sensor forms using documented V1 fixtures/live bridge.
- `AC-HUE-008` — Round-trip documented Hue V1 Rule condition/operator families and permitted action families through parser/editor/serializer tests, then create/update/enable/disable/delete a disposable Rule.
- `AC-HUE-009` — Round-trip documented Hue V1 Schedule time-pattern and permitted command families through parser/editor/serializer tests, then create/update/enable/disable/delete a disposable Schedule.
- `AC-HUE-010` — Create, read, update, and delete a disposable Resource Link and verify serialized link/class/description fields.
- `AC-TPL-010` — Remove a configured plug and inspect protocol trace to verify no command is sent to the device; re-add the endpoint and verify the unchanged plug remains controllable.
- `AC-UX-DEL-001` — Trigger Delete for each supported deletable type and verify a modal names the target and consequence before any destructive adapter call occurs.
- `AC-UX-DEL-002` — Open and cancel the dialog and verify zero destructive calls; reopen and confirm and verify exactly one destructive call.
- `AC-UX-DEL-003` — Inspect/render the dialog on Pixel 9 Pro portrait and verify spatial separation, disabled originating control, and functional Cancel.
- `AC-REL-004` — Cause ambiguous create/delete then background/kill/restart; verify no automatic repeat occurs and the next foreground refresh shows current bridge state for manual follow-up.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/destructive test/app/destructive
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-18.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-18.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
