# Phase 22 — Advanced Hue, Resource Links, and Diagnostics UI

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 12, Phase 17, Phase 18

## Objective

Implement the Advanced/Bridge surfaces for read-only Configuration/Capabilities, Resource Link management, and non-sensitive diagnostics, leaving credential workflows for the next phases.

## Why this phase exists

This is a cohesive administrative UI slice that does not require carrying provisioning state or TP-Link endpoint management.

## Authoritative requirements

- `FR-006` (supporting) — Bridge Configuration/Capabilities, Resource Links, Hue provisioning/reauthorization, and plug endpoint administration shall be accessible from an Advanced/Bridge area rather than requiring fixed-width primary tabs.
- `FR-013` (supporting) — Editors shall expose the fields and operations required for the Hue V1 and TP-Link management requirements while preventing unsupported/read-only fields from being presented as writable.
- `HUE-003` (supporting) — The application shall read and display the deployed bridge's Lights, Groups, Scenes, Sensors, Rules, Schedules, Resource Links, Bridge Configuration, and Capabilities exposed to the authorized V1 API user, except credential-bearing fields protected by SEC-002.
- `HUE-010` (supporting) — The application shall provide applicable create/read/update/delete operations for Hue Resource Links supported by the deployed Hue V1 API.
- `HUE-011` (supporting) — Hue Bridge Configuration and Capabilities shall be inspectable but shall not be directly editable by Home Dashboard. Home Dashboard shall not directly author or enable a Rule/Schedule whose own immediate embedded operation writes bridge Configuration/Capabilities or other bridge administration; link-button credential creation and same-bridge reauthorization are the only required bridge-administration writes. Recursive effects through other pre-existing automations are outside this requirement under DG-005.
- `SEC-002` (supporting) — Hue API credentials and credential-bearing authorization identifiers shall not be displayed as ordinary fields or included in production logs, exported diagnostics, exception messages surfaced by the application, or application-generated screenshots.
- `REL-006` (supporting) — Loss of network connectivity, endpoint timeout, malformed response, explicit protocol error, permission denial, and Hue authentication/bridge-identity failure shall be distinguishable in diagnostic information even when multiple classes share the same Unknown dashboard treatment.

## Relevant SAD sections

- `SAD_2.0.0.yaml:supported_resource_semantics.resource_link`
- `SAD_2.0.0.yaml:logging_and_diagnostics`
- `SAD_2.0.0.yaml:startup_and_readiness`
- `SAD_2.0.0.yaml:hue_v1_design.embedded_action_policy`

## In scope

- Read-only bridge Configuration and Capabilities views with sensitive fields absent.
- Resource Link list/editor CRUD with shared delete confirmation.
- Advanced diagnostics showing category/resource technical identifier/timing/status when safe.
- Placeholders/navigation entries for provisioning/reauthorization and plug administration that later phases replace.

## Explicitly out of scope

- Bridge configuration editing
- Firmware/reset/network operations
- Provisioning/reauthorization implementation
- Plug endpoint UI

## Expected repository changes

### Existing prerequisite files/directories

- src/ui/navigation/
- src/protocol/hue/bridgeReads.ts
- src/protocol/hue/resources/resourceLinks.ts
- `implementation_evidence/phase-12.md` (output of Phase 12)
- `implementation_evidence/phase-17.md` (output of Phase 17)
- `implementation_evidence/phase-18.md` (output of Phase 18)

### Expected outputs created or materially modified by this phase

- src/ui/screens/AdvancedHueScreen.tsx
- src/ui/screens/ResourceLinksScreen.tsx
- src/ui/editors/ResourceLinkEditor.tsx
- src/ui/components/DiagnosticsPanel.tsx
- test/ui/advancedHue/
- implementation_evidence/phase-22.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- No bridge config/capability field is writable.
- Diagnostics never contain Hue credential/authorization identifiers or raw household payload dumps.

## Tests

- Read-only bridge field inspection.
- Resource Link CRUD wiring and delete confirmation.
- Credential redaction in rendered diagnostics and exception surfaces.
- Forbidden admin action absence inspection.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-22.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-006` — Verify each listed function is reachable from Advanced/Bridge and Resource Links are not required to occupy a fixed primary tab.
- `AC-FR-013` — Using the documented Hue V1 resource catalog plus live fixtures, verify each supported field is editable/read-only as specified and unsupported fields cannot be submitted as writes.
- `AC-HUE-003` — Run against the frozen bridge fixture and verify all eight resource/configuration surfaces are represented without exposing credential-bearing fields.
- `AC-HUE-010` — Create, read, update, and delete a disposable Resource Link and verify serialized link/class/description fields.
- `AC-HUE-011` — Verify Configuration/Capabilities render read-only, no generic bridge-config write control exists, and a Rule/Schedule whose own immediate action writes bridge administration cannot be authored/enabled; direct app protocol traces contain no bridge-config mutation except create-user during provisioning/reauthorization.
- `AC-SEC-002` — Inject failures and inspect UI/log/diagnostic outputs for known test credentials/authorization IDs; verify none appear.
- `AC-REL-006` — Inject each class and verify diagnostic category differs while Unknown tiles remain visually consistent where applicable.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/advancedHue
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-22.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-22.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
