# Phase 03 — Protected Hue Binding Store

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 02

## Objective

Implement the protected `HueBinding {bridgeId, credential}` store with explicit Present/Absent/IoError semantics and no ordinary remove/switch API.

## Why this phase exists

Hue protocol code must never own persistence of credentials, and later provisioning/reauthorization must distinguish missing protected state from protected-store failure.

## Authoritative requirements

- `SEC-001` (**PRIMARY OWNER**) — The Hue API credential and the permanently bound Hue bridgeId shall be stored together as one protected Hue binding record using Android protected credential storage and shall not be stored in plaintext application configuration. A protected-store read error shall not be treated as absence of the binding record or as authorization to provision a different bridge.
- `SEC-002` (supporting) — Hue API credentials and credential-bearing authorization identifiers shall not be displayed as ordinary fields or included in production logs, exported diagnostics, exception messages surfaced by the application, or application-generated screenshots.
- `CON-002` (supporting) — After first successful Hue provisioning on a phone, Home Dashboard shall remain permanently bound to that Hue bridge identity for the lifetime of that app installation. It shall not support multiple bridges, bridge switching, bridge replacement, bridge migration, forgetting the bridge identity through ordinary in-app reset, or adoption of a different bridge identity.
- `HUE-017` (supporting) — Initial Hue provisioning shall be reported complete only after the returned credential and authenticated config.bridgeid are represented together by one protected Hue binding record. If protected storage fails or the process terminates after bridge credential creation but before that binding record is stored, the user may explicitly repeat first provisioning; an unused Hue API user may remain on the bridge and is an accepted residual risk. Once the binding record exists, ordinary in-app reset shall not remove it and the application shall never return to first-provisioning-for-any-bridge behavior unless the application's protected storage itself has been removed outside the supported in-app workflows.
- `HUE-018` (supporting) — After initial binding, every authenticated Hue session and reauthorization attempt shall verify that config.bridgeid equals the bridgeId in the protected Hue binding record before ordinary Hue control is enabled. A different bridgeid shall produce a hard identity-mismatch diagnostic and shall not be adoptable by the application.
- `HUE-019` (supporting) — If the stored Hue credential is rejected, the user shall be able to perform explicit link-button reauthorization for the same permanently bound bridge. The new credential shall replace the stored credential only after it authenticates a bridge with the stored bridgeid.
- `DATA-005` (supporting) — A persistence read/write I/O failure shall not be treated as successful absence or successful save and shall not automatically trigger default seeding.

## Relevant SAD sections

- `SAD_2.0.0.yaml:internal_domain_interfaces.types.HueBinding`
- `SAD_2.0.0.yaml:internal_domain_interfaces.services.CredentialStore`
- `SAD_2.0.0.yaml:security_architecture.credentials`
- `SAD_2.0.0.yaml:persistence_architecture.reset`

## In scope

- Install/use `expo-secure-store`.
- Implement a single fixed-key HueBinding record containing bridgeId and credential together.
- Implement `getBinding` and `setBinding`; expose no normal app API to delete/replace with a different bridge identity.
- Validate stored structure before returning Present.
- Ensure ordinary ConfigStore reset does not touch this record.

## Explicitly out of scope

- Network provisioning/link-button flow
- Reauthorization UI
- Hue HTTP requests
- Bridge switching/replacement logic

## Expected repository changes

### Existing prerequisite files/directories

- src/storage/
- implementation_evidence/phase-01.md
- `implementation_evidence/phase-02.md` (output of Phase 02)

### Expected outputs created or materially modified by this phase

- package.json
- package-lock.json
- app.json
- src/storage/CredentialStore.ts
- src/storage/hueBindingSchema.ts
- test/storage/CredentialStore.test.ts
- implementation_evidence/phase-03.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- A SecureStore read exception is IoError, never Absent.
- BridgeId and credential are persisted as one protected value; do not split them across independent keys.
- Do not add a normal in-app remove/forget/switch method.
- Test doubles must avoid logging credential values.

## Tests

- Present/Absent/IoError/read-malformed cases.
- setBinding failure does not report success.
- Config reset integration test proves protected binding remains unchanged.
- Static/unit inspection that binding/credential values are not placed in AsyncStorage.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-03.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-002` — After first Hue provisioning, attempt to configure or authenticate a bridge reporting a different bridgeid and verify Home Dashboard refuses Hue control and offers no switch/adopt/migrate workflow.
- `AC-HUE-017` — Inject protected-storage failure and process termination after create-user; verify setup is not reported complete, no automatic create-user retry occurs, and a later explicit retry can complete without a durable provisioning journal. Then perform Reset Local Configuration and verify the protected bridgeId/credential binding remains and a different bridge cannot be adopted.
- `AC-HUE-018` — Present a fixture with a different bridgeid at the configured address and verify all Hue control is disabled, the mismatch is diagnosed, and no adopt/switch/replacement action exists.
- `AC-HUE-019` — Reject the stored credential, perform link-button reauthorization on the same bridge and verify control resumes; repeat against a different bridgeid and verify the new credential is not promoted.
- `AC-DATA-005` — Inject read/write failures and verify UI reports unavailable/unsaved state, preserves existing data where readable, and does not claim success or seed defaults.
- `AC-SEC-001` — Inspect AsyncStorage/non-secret config and APK/runtime files after provisioning and verify the credential/bridgeId binding is present only through the protected credential-store abstraction; inject protected-store read failure and verify the app does not enter first-provisioning/adopt-new-bridge behavior.
- `AC-SEC-002` — Inject failures and inspect UI/log/diagnostic outputs for known test credentials/authorization IDs; verify none appear.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npx expo install expo-secure-store
npm run typecheck
npm run lint
npm run test:ci -- test/storage/CredentialStore.test.ts
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-03.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-03.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
