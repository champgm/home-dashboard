# Phase 16 — Foreground Lifecycle and Polling

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 15, Phase 08

## Objective

Implement foreground-only lifecycle generation, immediate refresh, exact 5,000 ms refresh opportunities, busy-skip behavior, Hue search-status polling ownership, and abandonment of all late callbacks on background.

## Why this phase exists

Lifecycle concurrency is independent of command semantics and is easier to verify after ApplicationService is deterministic.

## Authoritative requirements

- `CON-006` (**PRIMARY OWNER**) — The application shall initiate no Hue/TP-Link polling, device command, or phone-hosted automation while it is outside the Android foreground. On leaving the foreground it shall cancel or locally abandon in-flight device operations and shall ignore their late responses.
- `FR-001` (**PRIMARY OWNER**) — The application shall start and present its usable navigation shell when the Hue bridge, any plug, or all managed devices are unavailable.
- `FR-003` (**PRIMARY OWNER**) — Upon transition to the foreground, the application shall initiate a state refresh without waiting for the periodic polling interval.
- `FR-004` (**PRIMARY OWNER**) — While foregrounded, after the immediate foreground refresh is initiated, the application shall generate periodic refresh opportunities every 5,000 ms measured on a monotonic clock; an endpoint with a prior refresh still in flight shall be skipped rather than queued.
- `REL-007` (**PRIMARY OWNER**) — When the application leaves the foreground, every in-flight Hue/TP-Link operation shall be locally abandoned; late responses shall be ignored and the next foreground transition shall use FR-003 before normal commands/polling resume.
- `HUE-015` (supporting) — Hue search-for-new-lights and search-for-new-sensors shall be treated as bridge-owned foreground operations: before starting a search the application shall query the corresponding bridge search-status endpoint; if the bridge reports an active/recent search, that status shall be shown instead of blindly starting another. Local search polling shall stop outside the foreground and no process-durable local search journal is required.

## Relevant SAD sections

- `SAD_2.0.0.yaml:runtime_components`
- `SAD_2.0.0.yaml:state_and_concurrency.lifecycle_generation`
- `SAD_2.0.0.yaml:state_and_concurrency.hue_polling`
- `SAD_2.0.0.yaml:state_machines.lifecycle`
- `SAD_2.0.0.yaml:shutdown_and_backgrounding`
- `SAD_2.0.0.yaml:startup_and_readiness`

## In scope

- Implement LifecycleController using Android/React Native AppState and a monotonic scheduling source.
- Foreground: increment generation, immediately request Hue + plug refresh, then schedule 5,000 ms opportunities.
- Skip any endpoint with a prior refresh still in flight instead of queueing.
- Background: stop timers/search-status polling, clear local Pending as abandoned, increment generation, cancel where possible, ignore all late callbacks.
- Startup shell must not wait for device availability.
- On restart, Hue search state is not restored; foreground search UI re-queries bridge status.

## Explicitly out of scope

- UI navigation
- Background workers/notifications
- Durable operation journals

## Expected repository changes

### Existing prerequisite files/directories

- src/app/ApplicationService.ts
- src/app/DeviceStateStore.ts
- src/protocol/hue/search.ts
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-08.md` (output of Phase 08)

### Expected outputs created or materially modified by this phase

- src/app/LifecycleController.ts
- src/app/refreshScheduler.ts
- test/app/lifecycle/
- implementation_evidence/phase-16.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- No device I/O begins outside foreground.
- A foreground transition always attempts refresh before ordinary periodic cadence.
- Late responses from previous lifecycle generation cannot publish state.
- Use skip-not-queue for busy endpoints.

## Tests

- Fake monotonic clock exact 5,000 ms opportunity tests.
- Delayed operation then background -> Pending abandoned and late response ignored.
- Foreground re-entry -> immediate refresh.
- Busy endpoint skipped while independently free endpoints poll.
- Search status polling stops background and status is re-queried after restart/foreground.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-16.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-006` — Begin a deliberately delayed device operation, background the app, verify Pending is cleared/abandoned, no new device I/O begins while backgrounded, late responses do not publish state, and foregrounding triggers a fresh refresh.
- `AC-FR-001` — Start with all device routes blocked and verify navigation, configuration, Favorites editing, and diagnostics remain usable.
- `AC-FR-003` — Change device state externally while backgrounded, foreground the app, and verify refresh begins immediately and displays authoritative state.
- `AC-FR-004` — With controlled fake timers and delayed endpoints, verify refresh opportunities occur at 5,000 ms intervals, overlapping work is skipped, and no unbounded refresh queue forms.
- `AC-HUE-015` — Simulate app restart/background during a bridge search, then foreground/start the search screen and verify status is queried before any new POST; verify no local durable search-intent record exists.
- `AC-REL-007` — Background during delayed reads/writes and verify lifecycle generation invalidates late callbacks; foreground and verify immediate refresh precedes further normal use.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/lifecycle
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-16.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-16.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
