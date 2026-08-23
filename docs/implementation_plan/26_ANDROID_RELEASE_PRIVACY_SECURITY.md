# Phase 26 — Android Release, Privacy, and Security Hardening

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 01, Phase 02, Phase 03, Phase 04, Phase 05, Phase 06, Phase 07, Phase 08, Phase 09, Phase 10, Phase 11, Phase 12, Phase 13, Phase 14, Phase 15, Phase 16, Phase 17, Phase 18, Phase 19, Phase 20, Phase 21, Phase 22, Phase 23, Phase 24, Phase 25

## Objective

Produce the release Android configuration and security/privacy controls: sideloadable signed APK profile, backup/data-transfer exclusion, required cleartext local networking only through app adapters, conditional local-network-permission behavior, and no runtime cloud/analytics paths.

## Why this phase exists

Platform hardening should happen after the app works, per the project planning guidance, but before final target acceptance so the exact release artifact is what gets tested.

## Authoritative requirements

- `CON-004` (**PRIMARY OWNER**) — Release builds shall be privately signed Android APKs suitable for sideload installation on the two supported phones.
- `CON-008` (**PRIMARY OWNER**) — The application shall not expose or invoke device/bridge firmware update, factory reset, or Hue bridge network-reconfiguration operations.
- `PRIV-001` (**PRIMARY OWNER**) — The production runtime shall contain no analytics, advertising, usage telemetry, cloud device relay, cloud configuration synchronization, or mandatory external service dependency.
- `PRIV-002` (**PRIMARY OWNER**) — The production runtime shall contain no application-controlled path that intentionally sends Hue credentials, device state, Favorites, plug configuration, or household device metadata to a configured WAN service. Hue/TP-Link adapter request destinations shall be constructed from configured private/local IPv4 endpoints only.
- `PRIV-003` (**PRIMARY OWNER**) — Normal Hue and TP-Link control shall remain functional when the phone has local-LAN connectivity to the devices but no WAN route.
- `PRIV-004` (**PRIMARY OWNER**) — The Android release shall exclude Home Dashboard application-managed persistent data and Hue credentials from Android cloud backup and application-data device-to-device transfer.
- `SEC-004` (**PRIMARY OWNER**) — If the target Android API level requires explicit local-network permission, denial or revocation shall produce a distinct actionable diagnostic and shall not cause unreachable devices to be represented as Off.
- `SEC-005` (**PRIMARY OWNER**) — Private release-signing key material shall not be bundled in the APK, committed to application source, or stored in application runtime configuration.
- `CON-001` (supporting) — The production application shall support the two household Google Pixel 9 Pro phones running the current installed Android release at acceptance time.
- `SEC-002` (supporting) — Hue API credentials and credential-bearing authorization identifiers shall not be displayed as ordinary fields or included in production logs, exported diagnostics, exception messages surfaced by the application, or application-generated screenshots.
- `SEC-003` (supporting) — Legacy cleartext Hue/TP-Link protocol operations shall accept only configured private/local IPv4 destinations and the application shall not provide a general-purpose arbitrary HTTP/TCP request facility.
- `SEC-006` (supporting) — Any project-retained characterization/test artifact derived from deployed Hue data shall replace credential-bearing Hue API authorization path segments and credential fields with non-secret placeholders before use as baseline/test input.
- `QA-002` (supporting) — All externally initiated device-control behavior required by this SRS shall be testable without WAN connectivity.

## Relevant SAD sections

- `SAD_2.0.0.yaml:selected_platform.android`
- `SAD_2.0.0.yaml:android_network_configuration`
- `SAD_2.0.0.yaml:security_architecture`
- `SAD_2.0.0.yaml:logging_and_diagnostics`
- `SAD_2.0.0.yaml:implementation_constraints`

## In scope

- Configure Android package and Expo SDK 57 target API 36 release settings.
- Configure EAS/internal APK build profile for privately signed sideload APK.
- Ensure signing key material is outside source/runtime config.
- Disable Android backup and application-data device transfer; verify generated/release manifest behavior.
- Keep required local cleartext networking enabled while preventing any app-provided arbitrary request console.
- Implement conditional SEC-004 permission diagnostic only if the selected target API requires it; for target API 36 verify the future permission flow is not falsely requested.
- Inspect/remove analytics, advertising, cloud relay/sync, remote identity, Hue cloud, and TP-Link cloud dependencies/requests.
- Add release-oriented redaction/security regression tests.

## Explicitly out of scope

- Google Play submission
- API-37 migration not required by current selected target
- Feature implementation

## Expected repository changes

### Existing prerequisite files/directories

- app.json
- eas.json
- src/
- test/
- `implementation_evidence/phase-01.md` (output of Phase 01)
- `implementation_evidence/phase-02.md` (output of Phase 02)
- `implementation_evidence/phase-03.md` (output of Phase 03)
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)
- `implementation_evidence/phase-06.md` (output of Phase 06)
- `implementation_evidence/phase-07.md` (output of Phase 07)
- `implementation_evidence/phase-08.md` (output of Phase 08)
- `implementation_evidence/phase-09.md` (output of Phase 09)
- `implementation_evidence/phase-10.md` (output of Phase 10)
- `implementation_evidence/phase-11.md` (output of Phase 11)
- `implementation_evidence/phase-12.md` (output of Phase 12)
- `implementation_evidence/phase-13.md` (output of Phase 13)
- `implementation_evidence/phase-14.md` (output of Phase 14)
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-16.md` (output of Phase 16)
- `implementation_evidence/phase-17.md` (output of Phase 17)
- `implementation_evidence/phase-18.md` (output of Phase 18)
- `implementation_evidence/phase-19.md` (output of Phase 19)
- `implementation_evidence/phase-20.md` (output of Phase 20)
- `implementation_evidence/phase-21.md` (output of Phase 21)
- `implementation_evidence/phase-22.md` (output of Phase 22)
- `implementation_evidence/phase-23.md` (output of Phase 23)
- `implementation_evidence/phase-24.md` (output of Phase 24)
- `implementation_evidence/phase-25.md` (output of Phase 25)

### Expected outputs created or materially modified by this phase

- app.json
- eas.json
- artifacts/ (release APK output location)
- test/security/
- implementation_evidence/phase-26.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- EAS/build tooling may use network services; PRIV-001 applies to production runtime, not build infrastructure.
- APK must contain no private signing key material or Hue credentials.
- Android backup/device transfer exclusion must cover app-managed config and protected secret behavior as applicable.

## Tests

- Dependency/config inspection for no analytics/cloud runtime service.
- Public endpoint rejection/security adapter tests.
- Credential/log/fixture scanner.
- Release manifest inspection for backup/data-transfer settings.
- WAN-disabled local-control dry run if target available.
- Signed APK certificate verification.

### Target-gated verification

- The EAS build and APK verification are target/tooling-gated: the operator must have Expo/EAS access and signing credentials outside the repository. Store/copy the resulting APK at `artifacts/home-dashboard-release.apk` before running `apksigner`/`apkanalyzer`.
- If local LAN testing is available, disable WAN for the phone while keeping LAN access and smoke-test Hue/plug control; otherwise carry this item to Phase 27.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-26.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-001` — Install the signed release APK on both household Pixel 9 Pro phones and execute the end-to-end smoke suite without device-specific functional divergence.
- `AC-CON-004` — Build a release APK, verify it is signed with the project release certificate, sideload it on both phones, and verify an update signed with the same key installs in place.
- `AC-CON-008` — Inspect all Advanced/Bridge and plug administration actions and protocol traces; verify no update/reset/network-reconfiguration endpoint or TP-Link factory-reset/reboot command is available or emitted.
- `AC-PRIV-001` — Inspect release dependencies/configuration and capture runtime traffic during normal use; verify no analytics/ad/cloud/sync endpoint is contacted.
- `AC-PRIV-002` — Capture traffic with WAN available and exercise all main functions; verify protected household data is sent only to the configured private device endpoints and no app-controlled external service.
- `AC-PRIV-003` — Remove WAN while retaining LAN routing and execute the main Hue/plug control acceptance suite.
- `AC-PRIV-004` — Inspect the release manifest/data-extraction rules and perform backup/restore or migration negative tests showing Home Dashboard configuration/Favorites/credential are not restored to the other phone.
- `AC-SEC-002` — Inject failures and inspect UI/log/diagnostic outputs for known test credentials/authorization IDs; verify none appear.
- `AC-SEC-003` — Attempt public/multicast/loopback-invalid endpoint configuration and arbitrary protocol targets and verify rejection; inspect code/API surfaces for absence of a user-controlled arbitrary request console.
- `AC-SEC-004` — On a target/API combination requiring the permission, deny/revoke it and verify a permission diagnostic plus Unknown device state; on target API 36 verify no nonexistent permission flow is required.
- `AC-SEC-005` — Scan repository, build artifacts, and APK contents for signing private-key material and verify signing occurs outside runtime configuration.
- `AC-SEC-006` — Run the fixture secret scanner across the retained evidence and verify zero live credential/authorization identifiers remain.
- `AC-QA-002` — Execute protocol/integration/end-to-end device-control tests with WAN disabled and verify no test requires an external service.

## Acceptance completion note

Release/security criteria requiring the produced signed APK or real phones may be PENDING TARGET until the artifact/device checks in this phase or Phase 27 are complete.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npx expo-doctor
npm run typecheck
npm run lint
npm run test:ci -- test/security
npx expo export --platform android
npx eas-cli@latest build --platform android --profile release-apk
apksigner verify --print-certs artifacts/home-dashboard-release.apk
apkanalyzer manifest print artifacts/home-dashboard-release.apk
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-26.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-26.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
