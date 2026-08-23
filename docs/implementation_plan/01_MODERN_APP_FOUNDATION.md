# Phase 01 — Modern App Foundation

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** None.

## Objective

Establish a bootable Expo SDK 57 / React Native 0.86 TypeScript application shell, a single active runtime tree matching the SAD package boundaries, and deterministic local quality commands without porting device features yet.

## Why this phase exists

Every later phase depends on a modern, testable build and stable repository layout. Keeping feature migration out of this phase prevents SDK/toolchain debugging from being mixed with protocol behavior.

## Authoritative requirements

- `CON-001` (**PRIMARY OWNER**) — The production application shall support the two household Google Pixel 9 Pro phones running the current installed Android release at acceptance time.
- `CON-003` (**PRIMARY OWNER**) — The application shall not require an application login, user account, role model, or remote identity provider.
- `QA-003` (**PRIMARY OWNER**) — Hue V1 and TP-Link legacy protocol logic shall be isolated from UI/navigation so UI tests can run without live devices and protocol tests can run without rendering UI.
- `CON-004` (supporting) — Release builds shall be privately signed Android APKs suitable for sideload installation on the two supported phones.
- `PRIV-001` (supporting) — The production runtime shall contain no analytics, advertising, usage telemetry, cloud device relay, cloud configuration synchronization, or mandatory external service dependency.

## Relevant SAD sections

- `SAD_2.0.0.yaml:selected_platform.framework`
- `SAD_2.0.0.yaml:selected_platform.android`
- `SAD_2.0.0.yaml:repository_structure`
- `SAD_2.0.0.yaml:runtime_components`
- `SAD_2.0.0.yaml:implementation_constraints`

## In scope

- Upgrade the existing repository to Expo SDK 57 / React Native 0.86 and use Android package `com.zhna123.homedashboard.v2`.
- Establish the SAD root layout: `src/app`, `src/ui`, `src/protocol/hue`, `src/protocol/tplink`, `src/storage`, `src/config`, and `test`.
- Make the root `App.tsx` enter only the modern runtime. Legacy trees may remain temporarily as migration reference but must not be imported by the new runtime.
- Establish repeatable scripts named `typecheck`, `lint`, `test:ci`, and the normal Expo start/build scripts.
- Add the baseline test harness (Jest/Expo-compatible plus React Native component testing support) and one smoke test proving the shell renders without network/device availability.
- Create `implementation_evidence/` and the Phase 01 evidence file using the handoff template.

## Explicitly out of scope

- Hue or TP-Link protocol migration
- Navigation/resource tabs beyond a minimal shell
- Persistence behavior beyond any minimum required to boot
- Release signing or target-device acceptance

## Expected repository changes

### Existing prerequisite files/directories

- package.json
- package-lock.json
- app.json
- eas.json
- App.tsx
- src/
- screens/
- navigation/
- assets/

### Expected outputs created or materially modified by this phase

- package.json
- package-lock.json
- app.json
- src/app/
- src/ui/
- src/protocol/hue/
- src/protocol/tplink/
- src/storage/
- src/config/
- test/
- implementation_evidence/phase-01.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Do not add login/account/cloud dependencies.
- Do not delete legacy code solely to make tests green; either migrate it, isolate it from the runtime, or document why it is obsolete.
- End with one active application entry path. Duplicate legacy code may exist only as non-imported migration reference during later phases.
- The shell must render even with no Hue configuration and no reachable plugs.

## Tests

- Unit/smoke test for application shell startup with no device clients configured.
- Static import check or test ensuring UI code does not import concrete legacy protocol modules directly.
- Expo dependency compatibility check.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-01.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-001` — Install the signed release APK on both household Pixel 9 Pro phones and execute the end-to-end smoke suite without device-specific functional divergence.
- `AC-CON-003` — Install on a clean phone with WAN unavailable and verify the application reaches its local configuration UI without account creation or remote authentication.
- `AC-CON-004` — Build a release APK, verify it is signed with the project release certificate, sideload it on both phones, and verify an update signed with the same key installs in place.
- `AC-PRIV-001` — Inspect release dependencies/configuration and capture runtime traffic during normal use; verify no analytics/ad/cloud/sync endpoint is contacted.
- `AC-QA-003` — Replace adapters with fakes in UI tests and run protocol adapter suites headlessly; verify no UI module directly performs device socket/HTTP calls.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm install expo@^57.0.0
npx expo install --fix
npx expo-doctor
npm run typecheck
npm run lint
npm run test:ci
npx expo export --platform android
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-01.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-01.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
