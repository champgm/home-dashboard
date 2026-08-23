# Phase 24 — Hue Same-Bridge Reauthorization

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 10, Phase 21, Phase 23

## Objective

Implement explicit link-button credential replacement only for the permanently bound bridge and integrate safe manual Schedule command-authorization repair.

## Why this phase exists

Reauthorization has a different authority rule from first provisioning: an existing bridgeId must match. Separating it keeps bridge-identity failure paths compact.

## Authoritative requirements

- `HUE-018` (**PRIMARY OWNER**) — After initial binding, every authenticated Hue session and reauthorization attempt shall verify that config.bridgeid equals the bridgeId in the protected Hue binding record before ordinary Hue control is enabled. A different bridgeid shall produce a hard identity-mismatch diagnostic and shall not be adoptable by the application.
- `HUE-019` (**PRIMARY OWNER**) — If the stored Hue credential is rejected, the user shall be able to perform explicit link-button reauthorization for the same permanently bound bridge. The new credential shall replace the stored credential only after it authenticates a bridge with the stored bridgeid.
- `HUE-020` (supporting) — When updating an existing Hue resource, the application shall send only fields intentionally changed by the user or required by that specific API operation and shall not rewrite unrelated fields merely because the resource was opened/saved. In particular, unchanged Schedule commands shall not be rewritten or rebound. The Schedule editor shall provide an explicit user action to rebuild an editable command address using the current Home Dashboard credential without exposing the credential, for manual recovery after reauthorization when needed.
- `SEC-001` (supporting) — The Hue API credential and the permanently bound Hue bridgeId shall be stored together as one protected Hue binding record using Android protected credential storage and shall not be stored in plaintext application configuration. A protected-store read error shall not be treated as absence of the binding record or as authorization to provision a different bridge.
- `SEC-002` (supporting) — Hue API credentials and credential-bearing authorization identifiers shall not be displayed as ordinary fields or included in production logs, exported diagnostics, exception messages surfaced by the application, or application-generated screenshots.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.reauthorization`
- `SAD_2.0.0.yaml:hue_v1_design.partial_updates`
- `SAD_2.0.0.yaml:security_architecture.credentials`
- `SAD_2.0.0.yaml:accepted_architectural_risks`

## In scope

- Detect authentication rejection and expose explicit same-bridge reauthorization action.
- Create new Hue user only after explicit link-button user action.
- Authenticate `/config` with returned credential and require returned bridgeid equals stored bridgeId.
- Replace protected HueBinding credential only on exact bridgeId match.
- Different bridgeId -> hard mismatch diagnostic; do not store/adopt.
- Wire the Phase 21 Schedule explicit rebuild command-authorization action to current protected credential without displaying it.

## Explicitly out of scope

- Bridge switching/adoption
- Automatic Schedule command rewriting
- Durable credential transaction journal

## Expected repository changes

### Existing prerequisite files/directories

- src/app/HueProvisioningService.ts
- src/storage/CredentialStore.ts
- src/ui/editors/ScheduleEditor.tsx
- `implementation_evidence/phase-10.md` (output of Phase 10)
- `implementation_evidence/phase-21.md` (output of Phase 21)
- `implementation_evidence/phase-23.md` (output of Phase 23)

### Expected outputs created or materially modified by this phase

- src/app/HueReauthorizationService.ts
- src/ui/screens/HueReauthorizationScreen.tsx
- test/app/reauthorization/
- test/ui/reauthorization/
- implementation_evidence/phase-24.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Every authenticated session verifies returned bridgeid before ordinary Hue control is enabled.
- Credential replacement never occurs on mismatched bridgeid.
- Existing Schedule commands are unchanged unless the user invokes explicit rebuild.

## Tests

- Stored credential accepted + bridgeid match.
- Authentication rejected -> explicit reauthorization offered.
- New credential same bridge -> binding credential replaced.
- New credential different bridge -> hard mismatch and old binding preserved.
- Schedule unchanged across reauth; explicit rebuild path updates only authorization component.

### Target-gated verification

- Live same-bridge reauthorization requires link-button access and can create an additional Hue API user. If not safe during development, defer to Phase 27 and record that explicitly.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-24.md`. Do not pretend it passed.

## Acceptance focus

- `AC-HUE-018` — Present a fixture with a different bridgeid at the configured address and verify all Hue control is disabled, the mismatch is diagnosed, and no adopt/switch/replacement action exists.
- `AC-HUE-019` — Reject the stored credential, perform link-button reauthorization on the same bridge and verify control resumes; repeat against a different bridgeid and verify the new credential is not promoted.
- `AC-HUE-020` — Open/save unchanged resources and inspect requests for omitted unchanged fields; edit one field and verify unrelated Schedule command/address data is preserved by omission; invoke the explicit Schedule command-authorization rebuild action and verify only then is the command address rebuilt with the current credential, without displaying the credential.
- `AC-SEC-001` — Inspect AsyncStorage/non-secret config and APK/runtime files after provisioning and verify the credential/bridgeId binding is present only through the protected credential-store abstraction; inject protected-store read failure and verify the app does not enter first-provisioning/adopt-new-bridge behavior.
- `AC-SEC-002` — Inject failures and inspect UI/log/diagnostic outputs for known test credentials/authorization IDs; verify none appear.

## Acceptance completion note

Reauthorization is locally complete here; if live same-bridge reauthorization is deferred, its acceptance status remains PENDING TARGET until Phase 27.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/reauthorization test/ui/reauthorization test/ui/schedules
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-24.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-24.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
