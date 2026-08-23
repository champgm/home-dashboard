# Phase 15 — Command Orchestration and Device State

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 06, Phase 07, Phase 08, Phase 09, Phase 10, Phase 11, Phase 12, Phase 14

## Objective

Implement ApplicationService and DeviceStateStore command semantics: Known/Unknown/Pending, absolute desired-state actions, one Hue mutation at a time, read-back/refresh publication, failure isolation, and diagnostic classification.

## Why this phase exists

This phase is the single orchestration mental model. Lifecycle scheduling is deliberately deferred so command correctness can be tested with deterministic fake adapters.

## Authoritative requirements

- `FR-002` (**PRIMARY OWNER**) — Failure or unreachability of one managed endpoint shall not prevent commands to independently reachable endpoints.
- `FR-008` (**PRIMARY OWNER**) — A normal tap on a reachable Light, Group, Plug, enabled/disabled Rule, enabled/disabled Schedule, or writable enabled/disabled Sensor shall toggle its applicable binary state using an absolute desired-state command derived from the current known state. If an automation contains a directly prohibited operation under HUE-016, Home Dashboard shall not enable it.
- `FR-011` (**PRIMARY OWNER**) — A resource whose current state is unknown shall display the established full-tile semi-transparent question-mark indication and shall not be represented as Off.
- `FR-012` (**PRIMARY OWNER**) — A binary-state primary tap shall not be issued from an unknown state because the opposite state cannot be determined safely; explicit absolute actions may remain available in an editor where applicable.
- `FR-016` (**PRIMARY OWNER**) — If a reachable Hue Group reports a valid indeterminate aggregate on/off state, a normal primary tap shall issue an absolute On group action.
- `REL-001` (**PRIMARY OWNER**) — A failed command shall not be represented in the UI as successfully completed.
- `REL-002` (**PRIMARY OWNER**) — A foreground interactive device command shall not remain pending indefinitely; if protocol completion cannot be established within 5 seconds, Pending shall end and the result shall be classified as definite failure or ambiguous outcome.
- `REL-003` (**PRIMARY OWNER**) — If a foreground write has an ambiguous outcome, the application shall not automatically claim success and, where the resulting state is observable, shall attempt one read-back while foregrounded. A non-matching read-back does not prove the original write failed because another controller may have changed state.
- `REL-005` (**PRIMARY OWNER**) — Following a successful state-changing command while foregrounded, the next published stable state shall come from device/bridge read-back or refresh rather than an unverified optimistic assumption. Any refresh response that began before the command shall be ignored for publication.
- `REL-006` (**PRIMARY OWNER**) — Loss of network connectivity, endpoint timeout, malformed response, explicit protocol error, permission denial, and Hue authentication/bridge-identity failure shall be distinguishable in diagnostic information even when multiple classes share the same Unknown dashboard treatment.
- `FR-010` (supporting) — A normal tap on a resource that has neither a Scene activation action nor an applicable binary state shall issue no device/bridge command.

## Relevant SAD sections

- `SAD_2.0.0.yaml:runtime_components`
- `SAD_2.0.0.yaml:internal_domain_interfaces.types.ResourceState`
- `SAD_2.0.0.yaml:internal_domain_interfaces.types.CommandResult`
- `SAD_2.0.0.yaml:state_and_concurrency.hue_mutations`
- `SAD_2.0.0.yaml:state_and_concurrency.plug_operations`
- `SAD_2.0.0.yaml:state_machines.resource`
- `SAD_2.0.0.yaml:state_machines.command`
- `SAD_2.0.0.yaml:failure_and_deadline_architecture`

## In scope

- Implement DeviceStateStore domain state and technical diagnostic category without UI rendering.
- Implement primary-action intent resolution for known binary resources and Group indeterminate -> absolute On.
- Block binary primary action from Unknown.
- Serialize Hue mutations globally as specified; increment Hue state generation on mutation start; do not start snapshots during a Hue mutation.
- After successful Hue mutation, request full Hue authoritative refresh before stable publication.
- For plug writes, mark only target Pending and perform read-back when observable.
- Implement 5-second interactive deadline and one read-back for ambiguous observable writes while foregrounded.
- Ensure one endpoint failure cannot block independently reachable endpoints.

## Explicitly out of scope

- Five-second periodic scheduler/AppState integration
- UI components
- Delete confirmation UI
- Process-durable recovery

## Expected repository changes

### Existing prerequisite files/directories

- src/app/
- src/protocol/hue/
- src/protocol/tplink/
- `implementation_evidence/phase-06.md` (output of Phase 06)
- `implementation_evidence/phase-07.md` (output of Phase 07)
- `implementation_evidence/phase-08.md` (output of Phase 08)
- `implementation_evidence/phase-09.md` (output of Phase 09)
- `implementation_evidence/phase-10.md` (output of Phase 10)
- `implementation_evidence/phase-11.md` (output of Phase 11)
- `implementation_evidence/phase-12.md` (output of Phase 12)
- `implementation_evidence/phase-14.md` (output of Phase 14)

### Expected outputs created or materially modified by this phase

- src/app/ApplicationService.ts
- src/app/DeviceStateStore.ts
- src/app/commandResults.ts
- src/app/diagnostics.ts
- test/app/commands/
- implementation_evidence/phase-15.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- No optimistic stable success publication.
- A non-matching ambiguous-write read-back does not prove the original write failed.
- Any Hue snapshot begun before the current mutation generation is stale for publication.
- Do not auto-retry ambiguous create/delete/write operations.
- Unknown and Off are distinct domain states.

## Tests

- Fake-adapter command matrix across Light/Group/Scene/Sensor/Rule/Schedule/Plug.
- Unknown tap issues no toggle.
- Group indeterminate tap -> absolute On.
- Hue global mutation serialization and stale pre-mutation snapshot discard.
- Plug failure isolation.
- Five-second deadline and ambiguous read-back cases.
- Diagnostic category differentiation.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-15.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-002` — Block one plug and the Hue bridge independently while leaving another plug reachable; verify reachable endpoints remain operable.
- `AC-FR-008` — For each applicable resource type, verify known Off produces an absolute On request and known On produces an absolute Off/disabled request; verify a Rule/Schedule containing a directly prohibited action cannot be enabled.
- `AC-FR-010` — Tap read-only/non-binary resource tiles and verify the protocol adapters receive no mutation call.
- `AC-FR-011` — Force timeout/malformed-response states and verify the full-tile translucent question-mark treatment appears while Off styling does not.
- `AC-FR-012` — Mark a binary resource Unknown, tap its primary tile, and verify no toggle is sent; where an editor provides explicit On/Off, verify those absolute actions remain distinguishable.
- `AC-FR-016` — Provide a Group fixture with a valid mixed/indeterminate aggregate state and verify the primary tap emits an absolute On action.
- `AC-REL-001` — Inject each protocol failure class and verify no success indicator/state transition is published solely from the attempted command.
- `AC-REL-002` — Delay adapters beyond 5 seconds and verify Pending clears by the deadline with failure/ambiguous classification.
- `AC-REL-003` — Inject timeout-after-send, then matching/nonmatching read-back and concurrent-controller changes; verify matching can reconcile to success while nonmatching remains ambiguous.
- `AC-REL-005` — Start a delayed refresh, issue a successful write, let the old refresh return after reconciliation, and verify the stale response is ignored; verify the post-command authoritative read/refresh provides displayed state.
- `AC-REL-006` — Inject each class and verify diagnostic category differs while Unknown tiles remain visually consistent where applicable.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/commands
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-15.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-15.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
