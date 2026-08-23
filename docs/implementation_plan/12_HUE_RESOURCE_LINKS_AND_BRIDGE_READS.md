# Phase 12 — Hue Resource Links and Read-only Bridge Administration

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 04, Phase 05, Phase 11

## Objective

Complete Hue protocol coverage for Resource Links and bridge Configuration/Capabilities while enforcing that bridge administration is read-only except provisioning/reauthorization handled later.

## Why this phase exists

This closes the non-UI Hue V1 resource surface and provides the Advanced screen data without mixing in credential workflows.

## Authoritative requirements

- `HUE-010` (**PRIMARY OWNER**) — The application shall provide applicable create/read/update/delete operations for Hue Resource Links supported by the deployed Hue V1 API.
- `HUE-011` (**PRIMARY OWNER**) — Hue Bridge Configuration and Capabilities shall be inspectable but shall not be directly editable by Home Dashboard. Home Dashboard shall not directly author or enable a Rule/Schedule whose own immediate embedded operation writes bridge Configuration/Capabilities or other bridge administration; link-button credential creation and same-bridge reauthorization are the only required bridge-administration writes. Recursive effects through other pre-existing automations are outside this requirement under DG-005.
- `HUE-003` (supporting) — The application shall read and display the deployed bridge's Lights, Groups, Scenes, Sensors, Rules, Schedules, Resource Links, Bridge Configuration, and Capabilities exposed to the authorized V1 API user, except credential-bearing fields protected by SEC-002.
- `CON-008` (supporting) — The application shall not expose or invoke device/bridge firmware update, factory reset, or Hue bridge network-reconfiguration operations.
- `FR-006` (supporting) — Bridge Configuration/Capabilities, Resource Links, Hue provisioning/reauthorization, and plug endpoint administration shall be accessible from an Advanced/Bridge area rather than requiring fixed-width primary tabs.

## Relevant SAD sections

- `SAD_2.0.0.yaml:supported_resource_semantics.resource_link`
- `SAD_2.0.0.yaml:hue_v1_design.embedded_action_policy`
- `SAD_2.0.0.yaml:security_architecture.endpoint_restriction`

## In scope

- Implement Resource Link CRUD serializers and fixture tests.
- Expose bridge Configuration/Capabilities read DTOs with credential-bearing fields redacted/omitted.
- Ensure Hue adapter has no firmware update, reset, network reconfiguration, or arbitrary bridge-admin mutation method accessible to UI/ApplicationService.

## Explicitly out of scope

- Advanced screen rendering
- Link-button provisioning/reauthorization

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/HueV1Adapter.ts
- src/protocol/hue/HueActionPolicy.ts
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)
- `implementation_evidence/phase-11.md` (output of Phase 11)

### Expected outputs created or materially modified by this phase

- src/protocol/hue/resources/resourceLinks.ts
- src/protocol/hue/bridgeReads.ts
- test/protocol/hue/resourceLinks/
- test/protocol/hue/bridgeReads/
- implementation_evidence/phase-12.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Bridge config/capabilities are inspectable only.
- Link-button create-user is not implemented here.
- Resource Link delete remains a resource delete and later UI must use confirmation.

## Tests

- Resource Link CRUD fixture tests.
- Credential/whitelist fields absent from bridge display DTOs.
- Static/API surface test proving forbidden bridge-admin methods are unavailable.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-12.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-008` — Inspect all Advanced/Bridge and plug administration actions and protocol traces; verify no update/reset/network-reconfiguration endpoint or TP-Link factory-reset/reboot command is available or emitted.
- `AC-FR-006` — Verify each listed function is reachable from Advanced/Bridge and Resource Links are not required to occupy a fixed primary tab.
- `AC-HUE-003` — Run against the frozen bridge fixture and verify all eight resource/configuration surfaces are represented without exposing credential-bearing fields.
- `AC-HUE-010` — Create, read, update, and delete a disposable Resource Link and verify serialized link/class/description fields.
- `AC-HUE-011` — Verify Configuration/Capabilities render read-only, no generic bridge-config write control exists, and a Rule/Schedule whose own immediate action writes bridge administration cannot be authored/enabled; direct app protocol traces contain no bridge-config mutation except create-user during provisioning/reauthorization.

## Acceptance completion note

`AC-HUE-010` protocol CRUD is completed here; user-facing Resource Link editor behavior closes in Phase 22 and live acceptance in Phase 27.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/resourceLinks test/protocol/hue/bridgeReads
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-12.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-12.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
