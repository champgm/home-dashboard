# Phase 14 — TP-Link Plug Feature Protocol

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 13

## Objective

Complete TP-Link sysinfo, relay, physical alias, and optional energy operations with capability-driven result models and fixture/live regression tests.

## Why this phase exists

Once raw transport is proven, the remaining TP-Link domain is small and cohesive and can be completed without UI context.

## Authoritative requirements

- `TPL-005` (**PRIMARY OWNER**) — The application shall display locally returned plug information including physical alias, model, hardware/software identifiers, MAC, signal information, relay state, and feature indicators when present.
- `TPL-006` (**PRIMARY OWNER**) — The application shall read and set plug relay power state.
- `TPL-008` (**PRIMARY OWNER**) — The application shall expose energy/consumption information only when the plug reports that capability and shall not treat absence of energy monitoring as an error.
- `TPL-007` (supporting) — The sole user-visible plug name shall be the alias stored on the physical plug; renaming in Home Dashboard shall update that device alias. Before a plug has ever returned an alias, the UI may show its configured IPv4 endpoint only as a technical locator, not as an application-local plug name.
- `REL-001` (supporting) — A failed command shall not be represented in the UI as successfully completed.
- `REL-002` (supporting) — A foreground interactive device command shall not remain pending indefinitely; if protocol completion cannot be established within 5 seconds, Pending shall end and the result shall be classified as definite failure or ambiguous outcome.
- `REL-003` (supporting) — If a foreground write has an ambiguous outcome, the application shall not automatically claim success and, where the resulting state is observable, shall attempt one read-back while foregrounded. A non-matching read-back does not prove the original write failed because another controller may have changed state.

## Relevant SAD sections

- `SAD_2.0.0.yaml:plug_protocol_design.commands`
- `SAD_2.0.0.yaml:plug_protocol_design.result_rules`
- `SAD_2.0.0.yaml:plug_protocol_design.capabilities`
- `SAD_2.0.0.yaml:supported_resource_semantics.plug`

## In scope

- Implement `getSysInfo`, `getPower`, `setPower`, `setAlias`, and `getEnergy`.
- Map returned sysinfo fields without inventing unavailable data.
- Detect energy capability from responses/capability behavior rather than model-name assumption alone.
- Implement one observable write read-back hook for later ApplicationService.

## Explicitly out of scope

- Plug endpoint administration UI
- Favorites/tile rendering

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/tplink/TpLinkLegacyAdapter.ts
- test/fixtures/characterization/
- `implementation_evidence/phase-13.md` (output of Phase 13)

### Expected outputs created or materially modified by this phase

- src/protocol/tplink/models.ts
- src/protocol/tplink/commands.ts
- test/protocol/tplink/features/
- implementation_evidence/phase-14.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- HS100/HS103 absence of emeter is not an error.
- HS110 characterized energy telemetry is represented when returned.
- Alias is the physical device alias; do not introduce a local display-name field.

## Tests

- Sanitized fixtures for representative HS100, HS103, HS110.
- Relay on/off request + read-back behavior using mocks/fixtures.
- Alias set/read-back.
- Energy supported and unsupported branches.

### Target-gated verification

- Optional repeat against all three deployed model families if convenient; mandatory representative-model end-to-end verification is closed in Phase 27.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-14.md`. Do not pretend it passed.

## Acceptance focus

- `AC-TPL-005` — Feed characterized HS100/HS103/HS110 sysinfo and verify returned fields are represented without inventing unavailable fields.
- `AC-TPL-006` — For representative deployed HS100/HS103/HS110 devices, command On and Off and verify read-back matches each state.
- `AC-TPL-007` — Rename each representative plug, verify sysinfo returns the new physical alias, restore it, and verify a never-contacted endpoint is labeled only by its technical address.
- `AC-TPL-008` — Verify HS110 energy data is shown and HS100/HS103 unsupported-emeter responses produce no error state or invented telemetry.
- `AC-REL-001` — Inject each protocol failure class and verify no success indicator/state transition is published solely from the attempted command.
- `AC-REL-002` — Delay adapters beyond 5 seconds and verify Pending clears by the deadline with failure/ambiguous classification.
- `AC-REL-003` — Inject timeout-after-send, then matching/nonmatching read-back and concurrent-controller changes; verify matching can reconcile to success while nonmatching remains ambiguous.

## Acceptance completion note

TP-Link protocol criteria are locally/fixture-complete here; representative deployed-device verification closes in Phase 27.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/tplink/features
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-14.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-14.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
