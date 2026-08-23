# Phase 05 — Hue Snapshot and Compatibility Fixtures

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 04

## Objective

Establish sanitized executable Hue fixture coverage and implement read-only snapshot/config/capability parsing sufficient to populate every required Hue resource collection without UI dependencies.

## Why this phase exists

The live API 1.38.0 evidence is the compatibility anchor. Settling snapshot shape and fixture safety before CRUD work gives every later Hue phase stable regression input.

## Authoritative requirements

- `HUE-003` (**PRIMARY OWNER**) — The application shall read and display the deployed bridge's Lights, Groups, Scenes, Sensors, Rules, Schedules, Resource Links, Bridge Configuration, and Capabilities exposed to the authorized V1 API user, except credential-bearing fields protected by SEC-002.
- `SEC-006` (**PRIMARY OWNER**) — Any project-retained characterization/test artifact derived from deployed Hue data shall replace credential-bearing Hue API authorization path segments and credential fields with non-secret placeholders before use as baseline/test input.
- `CON-007` (supporting) — Hue and TP-Link device firmware/software upgrades shall not be prerequisites for any required Home Dashboard function.
- `QA-003` (supporting) — Hue V1 and TP-Link legacy protocol logic shall be isolated from UI/navigation so UI tests can run without live devices and protocol tests can run without rendering UI.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.snapshot`
- `SAD_2.0.0.yaml:hue_v1_design.full_management_strategy`
- `SAD_2.0.0.yaml:verification_architecture.baseline_characterization`
- `SAD_2.0.0.yaml:verification_architecture.integration_tests`
- `SAD_2.0.0.yaml:security_architecture.fixture_sanitization`

## In scope

- Verify the SHA-256 of `home-dashboard-characterization-evidence-1.1.0.tar.gz`.
- Extract/copy only sanitized fixture data needed for tests into a committed fixture location or deterministic preparation path.
- Implement/extend Hue snapshot reads for lights/groups/scenes/sensors/rules/schedules/resourcelinks/config/capabilities.
- Preserve unknown/read-only fields in model representations needed for display while preventing them from being blindly emitted by writers later.
- Implement CI/unit secret scanner for retained Hue fixtures and credential-bearing `/api/<authorization>/...` paths.

## Explicitly out of scope

- CRUD mutation payloads
- Editors
- Live destructive tests

## Expected repository changes

### Existing prerequisite files/directories

- home-dashboard-characterization-evidence-1.1.0.tar.gz
- src/protocol/hue/HueV1Adapter.ts
- `implementation_evidence/phase-04.md` (output of Phase 04)

### Expected outputs created or materially modified by this phase

- test/fixtures/characterization/
- src/protocol/hue/snapshot.ts
- src/protocol/hue/models/
- test/protocol/hue/snapshot/
- scripts/check-characterization-secrets.mjs
- implementation_evidence/phase-05.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Do not alter fixture semantics merely to fit a preferred model.
- Credential-bearing fixture material must fail the secret scanner.
- Snapshot parsing must tolerate characterized optional/unknown fields without inventing values.
- Bridge Configuration/Capabilities models are read representations only.

## Tests

- Fixture SHA validation.
- Secret scanner negative and positive tests.
- Parse all characterized Hue collections and bridge config/capabilities.
- Unknown optional field preservation/read compatibility.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-05.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-007` — Execute the acceptance suite against the frozen characterized bridge and deployed HS100/HS103/HS110 firmware without device upgrades.
- `AC-HUE-003` — Run against the frozen bridge fixture and verify all eight resource/configuration surfaces are represented without exposing credential-bearing fields.
- `AC-SEC-006` — Run the fixture secret scanner across the retained evidence and verify zero live credential/authorization identifiers remain.
- `AC-QA-003` — Replace adapters with fakes in UI tests and run protocol adapter suites headlessly; verify no UI module directly performs device socket/HTTP calls.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
sha256sum home-dashboard-characterization-evidence-1.1.0.tar.gz
node scripts/check-characterization-secrets.mjs
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/snapshot
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-05.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-05.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
