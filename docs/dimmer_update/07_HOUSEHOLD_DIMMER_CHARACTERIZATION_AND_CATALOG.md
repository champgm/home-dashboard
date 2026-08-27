# Phase 07 — Household Dimmer Characterization and Catalog

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Capture a sanitized read-only fixture from the actual household dimmer, derive the production model/event catalog entry only from that evidence, and verify the real bridge projects the physical controls/gestures and current bindings correctly. This is the first phase allowed to add a production household dimmer mapping.

## Why this phase exists

`AC-HUE-021` intentionally defers the deployed model/event mapping until implementation acceptance. Earlier phases prove generic behavior with synthetic catalogs so target availability does not block local development. This phase closes the characterization gap without inventing generalized support.

## Authoritative requirements

- `HUE-021`
- `HUE-022`
- `HUE-007`
- `HUE-008`
- `PRIV-002`
- `SEC-002`

## Relevant SAD sections

- `hue_v1_design.dimmer_management.household_characterization`
- `hue_v1_design.dimmer_management.event_catalog`
- `hue_v1_design.dimmer_management.physical_identity`
- `architectural_decisions.ADR-022`
- `security_architecture`
- `logging_and_diagnostics`

## In scope

- Add a small developer-only read-only capture script or harness entry that reads the configured/local Hue snapshot and emits only the Sensor(s), Rules, Schedules, Resource Links, helper Sensors, and referenced Light/Group/Scene metadata needed to characterize one selected physical dimmer.
- The capture input may use environment/local secret material, but output must redact API usernames/credentials and pass the existing characterization secret scan.
- On the real household bridge, capture `test/fixtures/characterization/hue.household-dimmer.json` (or a comparably named sanitized fixture).
- From that fixture, add the minimal production identity/event catalog entry for the deployed dimmer model and only the action/gesture forms actually characterized.
- Add fixture-backed regression tests proving the deployed dimmer opens as one physical device and maps its real numeric events to human-readable controls/gestures.
- Record any unsupported/custom deployed bindings as Advanced/read-only rather than extending the catalog by guesswork.

## Explicitly out of scope

- No writes to the bridge are required for characterization capture.
- No model/event support beyond evidence captured from the household or already approved fixtures.
- No cloud upload, telemetry, or fixture containing Hue credentials/API usernames.
- No final destructive/live behavior acceptance; Phase 08 performs end-to-end edit verification.

## Expected repository changes

### Existing prerequisite files

- `scripts/check-characterization-secrets.mjs`
- `test/fixtures/characterization/hue.snapshot.json`
- `src/protocol/hue/dimmer/modelCatalog.ts`
- `src/protocol/hue/dimmer/projector.ts`
- `src/app/developmentLogger.ts`

### Expected new/modified outputs

#### Existing files expected to modify

- `src/protocol/hue/dimmer/modelCatalog.ts`
- `scripts/check-characterization-secrets.mjs`

#### New files expected to create

- `scripts/capture-hue-dimmer-fixture.mjs`
- `test/fixtures/characterization/hue.household-dimmer.json`
- `test/protocol/hue/dimmer/householdFixture.test.ts`
- `implementation_evidence/dimmer-2.4.1/phase-07.md`

## Required implementation behavior

- This phase is target-gated. If the household bridge/dimmer is unavailable, implement/test the capture tooling locally, record the pending live capture, and do not invent or commit a production mapping.
- Capture is read-only and local. Secrets are inputs only; the fixture must be credential-safe.
- Production event labels come from observed `capabilities.inputs.events`/state/rule relationships for the actual model, not internet assumptions.
- If physical identity or event mapping is genuinely ambiguous in captured data, stop and report the evidence; do not silently choose a mapping.

## Tests

- Unit-test capture sanitization with synthetic secret-bearing input.
- Run `check:fixture-secrets` on the new fixture.
- Fixture-backed test validates physical device association, real control/gesture labels, target resolution, Advanced IDs/raw values, and custom/unsupported visibility.
- On target, exercise each physical dimmer control/gesture read-only and confirm the observed button events match the catalog entry; record results in phase evidence.

## Acceptance focus

- `AC-HUE-021`
- `AC-HUE-022`
- `AC-HUE-007`
- `AC-HUE-008`
- `AC-PRIV-002`
- `AC-SEC-002`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
npm run typecheck
npm test -- --runInBand test/protocol/hue/dimmer/householdFixture.test.ts
npm run check:fixture-secrets
npm run test:ci
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-07.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] Read-only capture tooling exists and is secret-safe.
- [ ] A sanitized actual-household dimmer fixture is committed, or the target-gated item is explicitly open and phase cannot claim full completion.
- [ ] Production model/event catalog entry is derived only from captured evidence.
- [ ] Real control/gesture observations match the catalog mapping.
- [ ] Local regression suite passes.
- [ ] Phase evidence is persisted.
