# Phase 23 — Hue Initial Provisioning

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 02, Phase 03, Phase 04, Phase 05, Phase 22

## Objective

Implement first-install GUI bridge IPv4 setup and Hue link-button provisioning that permanently binds the app installation only after `{bridgeId, credential}` is successfully stored together.

## Why this phase exists

Initial provisioning is rare security-sensitive setup and is kept separate from ordinary control and reauthorization so its one-way permanent-binding invariant is easy to reason about.

## Authoritative requirements

- `CON-002` (**PRIMARY OWNER**) — After first successful Hue provisioning on a phone, Home Dashboard shall remain permanently bound to that Hue bridge identity for the lifetime of that app installation. It shall not support multiple bridges, bridge switching, bridge replacement, bridge migration, forgetting the bridge identity through ordinary in-app reset, or adoption of a different bridge identity.
- `HUE-001` (**PRIMARY OWNER**) — The user shall be able to configure the permanently bound Hue bridge by private/local IPv4 address through the GUI.
- `HUE-002` (**PRIMARY OWNER**) — The application shall support Hue V1 local API credential creation using the bridge link-button authorization flow and shall not require Hue cloud authentication or cloud discovery.
- `HUE-017` (**PRIMARY OWNER**) — Initial Hue provisioning shall be reported complete only after the returned credential and authenticated config.bridgeid are represented together by one protected Hue binding record. If protected storage fails or the process terminates after bridge credential creation but before that binding record is stored, the user may explicitly repeat first provisioning; an unused Hue API user may remain on the bridge and is an accepted residual risk. Once the binding record exists, ordinary in-app reset shall not remove it and the application shall never return to first-provisioning-for-any-bridge behavior unless the application's protected storage itself has been removed outside the supported in-app workflows.
- `SEC-001` (supporting) — The Hue API credential and the permanently bound Hue bridgeId shall be stored together as one protected Hue binding record using Android protected credential storage and shall not be stored in plaintext application configuration. A protected-store read error shall not be treated as absence of the binding record or as authorization to provision a different bridge.
- `DATA-003` (supporting) — If the persisted non-secret configuration dataset is unreadable or invalid, the application shall start its navigation/configuration shell, identify the local-configuration error, shall not silently overwrite the stored value or seed defaults, and shall require explicit user Reset Local Configuration before discarding it.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.provisioning`
- `SAD_2.0.0.yaml:persistence_architecture.save`
- `SAD_2.0.0.yaml:security_architecture.credentials`
- `SAD_2.0.0.yaml:startup_and_readiness`
- `SAD_2.0.0.yaml:decision_guardrails`

## In scope

- Advanced GUI for bridge private IPv4 save.
- Provisioning state only when `CredentialStore=Absent`; IoError disables provisioning.
- Persist bridge IPv4 before invoking create-user.
- Explicit link-button create-user request; authenticate `/config` with returned credential; obtain bridgeid.
- Write one protected HueBinding; report setup complete only after success.
- Once Present, disable any workflow that would first-provision/adopt another bridge.
- If process/storage fails before binding persistence, report incomplete setup; explicit user retry is permitted and may leave an unused Hue user.

## Explicitly out of scope

- Durable provisioning journal
- Bridge switching/replacement
- Same-bridge reauthorization (Phase 24)

## Expected repository changes

### Existing prerequisite files/directories

- src/storage/CredentialStore.ts
- src/storage/ConfigStore.ts
- src/protocol/hue/HueV1Adapter.ts
- src/ui/screens/AdvancedHueScreen.tsx
- `implementation_evidence/phase-02.md` (output of Phase 02)
- `implementation_evidence/phase-03.md` (output of Phase 03)
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)
- `implementation_evidence/phase-22.md` (output of Phase 22)

### Expected outputs created or materially modified by this phase

- src/app/HueProvisioningService.ts
- src/ui/screens/HueProvisioningScreen.tsx
- test/app/provisioning/
- test/ui/provisioning/
- implementation_evidence/phase-23.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Different bridge adoption is not a feature.
- Ordinary Reset Local Configuration cannot erase protected bridge identity.
- No automatic create-user retry after ambiguous/process-loss outcome.

## Tests

- Absent binding happy path.
- SecureStore IoError -> provisioning disabled.
- create-user success + config bridgeid + setBinding failure -> incomplete and no automatic retry.
- After binding Present, provisioning screen cannot adopt a different bridge.
- Local config reset leaves binding untouched.

### Target-gated verification

- Live link-button provisioning on one acceptance phone may be deferred to Phase 27 if the existing app binding must not be disturbed during development. Use mocks/fixtures locally and record target-gated status.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-23.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-002` — After first Hue provisioning, attempt to configure or authenticate a bridge reporting a different bridgeid and verify Home Dashboard refuses Hue control and offers no switch/adopt/migrate workflow.
- `AC-HUE-001` — Save a valid private bridge IPv4 address through Advanced/Bridge and verify it persists; reject hostnames and public/invalid addresses.
- `AC-HUE-002` — With WAN blocked, perform link-button provisioning against the bridge and verify an authenticated local Hue V1 credential is obtained and stored.
- `AC-HUE-017` — Inject protected-storage failure and process termination after create-user; verify setup is not reported complete, no automatic create-user retry occurs, and a later explicit retry can complete without a durable provisioning journal. Then perform Reset Local Configuration and verify the protected bridgeId/credential binding remains and a different bridge cannot be adopted.
- `AC-DATA-003` — Inject malformed JSON and storage read failure; verify the shell starts with a configuration-error diagnostic, the raw value is not overwritten, and defaults appear only after explicit Reset.
- `AC-SEC-001` — Inspect AsyncStorage/non-secret config and APK/runtime files after provisioning and verify the credential/bridgeId binding is present only through the protected credential-store abstraction; inject protected-store read failure and verify the app does not enter first-provisioning/adopt-new-bridge behavior.

## Acceptance completion note

Provisioning is locally complete here; if the live link-button test is deferred, its acceptance status remains PENDING TARGET until Phase 27.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/provisioning test/ui/provisioning
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-23.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-23.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
