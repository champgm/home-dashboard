# Phase 08 — Hue Sensors and Search Protocol

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 04, Phase 05

## Objective

Implement Sensor management plus Hue Light/Sensor search status-before-start operations as foreground-owned protocol behavior without any persistent search journal.

## Why this phase exists

Search is bridge-owned asynchronous behavior and Sensors have configuration forms distinct from ordinary resource CRUD. Keeping it separate avoids mixing search lifecycle with Rules/Schedules.

## Authoritative requirements

- `HUE-007` (**PRIMARY OWNER**) — The application shall provide applicable create/read/update/delete, configuration, and search-for-new-sensors operations for Hue Sensors supported by the deployed Hue V1 API.
- `HUE-015` (**PRIMARY OWNER**) — Hue search-for-new-lights and search-for-new-sensors shall be treated as bridge-owned foreground operations: before starting a search the application shall query the corresponding bridge search-status endpoint; if the bridge reports an active/recent search, that status shall be shown instead of blindly starting another. Local search polling shall stop outside the foreground and no process-durable local search journal is required.
- `CON-006` (supporting) — The application shall initiate no Hue/TP-Link polling, device command, or phone-hosted automation while it is outside the Android foreground. On leaving the foreground it shall cancel or locally abandon in-flight device operations and shall ignore their late responses.
- `REL-007` (supporting) — When the application leaves the foreground, every in-flight Hue/TP-Link operation shall be locally abandoned; late responses shall be ignored and the next foreground transition shall use FR-003 before normal commands/polling resume.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.search`
- `SAD_2.0.0.yaml:supported_resource_semantics.sensor`
- `SAD_2.0.0.yaml:state_machines.hue_search`

## In scope

- Implement documented/deployed Sensor create/read/update/delete/configuration serializers.
- Implement GET search-status for `/lights/new` and `/sensors/new`.
- Implement start-search calls that require the caller to supply a status result showing a new POST is appropriate.
- Expose search status data needed by UI/lifecycle; do not persist it.

## Explicitly out of scope

- Lifecycle timers/background stop behavior (Phase 16)
- Sensor editor UI
- Process-durable search state

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/HueV1Adapter.ts
- test/fixtures/characterization/
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)

### Expected outputs created or materially modified by this phase

- src/protocol/hue/resources/sensors.ts
- src/protocol/hue/search.ts
- test/protocol/hue/sensors/
- test/protocol/hue/search/
- implementation_evidence/phase-08.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Never blindly POST a new search without status inspection.
- A status timeout is not search completion.
- No local durable journal or restart replay is introduced.

## Tests

- Sensor CRUD/config fixtures.
- Search inactive -> start path.
- Search active/recent -> no POST path.
- Malformed/timeout status produces diagnostic and no blind POST.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-08.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-006` — Begin a deliberately delayed device operation, background the app, verify Pending is cleared/abandoned, no new device I/O begins while backgrounded, late responses do not publish state, and foregrounding triggers a fresh refresh.
- `AC-HUE-007` — Exercise Sensor read/configuration/search and disposable create/update/delete for supported sensor forms using documented V1 fixtures/live bridge.
- `AC-HUE-015` — Simulate app restart/background during a bridge search, then foreground/start the search screen and verify status is queried before any new POST; verify no local durable search-intent record exists.
- `AC-REL-007` — Background during delayed reads/writes and verify lifecycle generation invalidates late callbacks; foreground and verify immediate refresh precedes further normal use.

## Acceptance completion note

`AC-HUE-007` protocol/search portions are completed here; editor and live-target portions close in Phase 20 and Phase 27.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/sensors test/protocol/hue/search
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-08.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-08.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
