# Phase 03 — Android Emulator and Session Capture

## Plan

`local_running_and_logs`

## Phase

- Phase: `03 — ANDROID EMULATOR AND SESSION CAPTURE`
- Status: `COMPLETE`
- Commit/revision: working tree; no commit was created by this task
- Date: 2026-08-24

## Work completed

- Added `npm run setup:android`, `npm run dev:android:check`, and `npm run dev:android`.
- Added deterministic SDK/tool resolution, official-modern-tool preflight, Android 36 Google APIs x86_64 package constants, and idempotent dedicated AVD setup for `Home_Dashboard_API_36` using the `pixel_9_pro` profile.
- Added non-mutating prerequisite reporting for Node/npm/Java, SDK tools, target image, AVD, ADB/device state, and Linux virtualization.
- Added native Expo build/run orchestration with deterministic AVD selection, package-UID-scoped Logcat, session-start boundary, source labeling, identical archive/latest files, partial-log preservation, and child cleanup. The emulator is intentionally left running after Ctrl+C.
- Corrected the target-discovered Expo selection defect: `--device` now receives the AVD name `Home_Dashboard_API_36`, while `ANDROID_SERIAL` constrains ADB/Gradle to the exact running emulator instance.
- Corrected the target-discovered host-port collision: Metro now selects the first unused port from 8082 upward; Expo passes that port into the Gradle debug build and ADB installs a matching reverse rule. An unrelated process such as qBittorrent may therefore continue using host port 8081.
- Replaced obsolete README commands/configuration and added ignored `logs/**` output without removing the pre-existing `notes.md` ignore entry.

## Findings addressed

### Primary

- `SUP-001`, `SUP-002`, `SUP-006`

### Supporting verification

- `SUP-003`, `SUP-004`, `SUP-005`

## Relevant authority exercised

- SRS requirements: `CON-001`, `QA-002`, `QA-003`, `SEC-002`, `PRIV-001`, `PRIV-002`, `REL-006`
- SRS acceptance criteria: `AC-CON-001`, `AC-QA-002`, `AC-QA-003`, `AC-SEC-002`, `AC-REL-006`
- SAD sections/ADRs: `selected_platform`, `ADR-001`, `ADR-003`, `ADR-004`, `android_network_configuration`, `logging_and_diagnostics`, `repository_structure`, `verification_architecture`

## Tests and checks executed

```text
node test/scripts/androidDevelopment.test.mjs
PASS — 13 tests, including separate Metro ownership/readiness, collision-free port/build/ADB mapping, detached emulator lifetime, and AVD-name/ADB-serial Expo selection.
node --check scripts/setup-android-debug.mjs
PASS.
node --check scripts/run-android-with-logs.mjs
PASS.
npm run setup:android
PASS — operator installed modern tools, image, and dedicated AVD.
npm run dev:android:check
PASS — modern tools, Android 36 platform/image/AVD, ADB query, and /dev/kvm access.
npm run dev:android
PASS — session `logs/android-20260824-205530.log` records Metro on port 8082, successful build/install/open, package-scoped `bootstrap.completed`, runtime diagnostics, and clean completion.
```

Exact target constants:

```text
Package: com.zhna123.homedashboard.v2
AVD: Home_Dashboard_API_36
Platform: platforms;android-36
Image: system-images;android-36;google_apis;x86_64
Device profile: pixel_9_pro
Logcat: --uid=<package UID> -T <session-start boundary> -v threadtime
```

## Files materially changed

- `scripts/setup-android-debug.mjs`
- `scripts/run-android-with-logs.mjs`
- `test/scripts/androidDevelopment.test.mjs`
- `package.json`
- `.gitignore` (the existing `notes.md` rule was preserved)
- `README.md`

## Logging and diagnostic evidence

- Operation/failure mode exercised: deterministic pure runner behavior, missing-tool diagnostics, AVD selection among unrelated devices, split/partial output lines, package UID parsing, and child signal cleanup.
- Location/context retained: source label, timestamp, emulator serial/AVD, package UID, operation output, and session paths; no environment dump is emitted.
- Useful underlying cause retained: setup/preflight command and bounded failure output.
- Bounds/redaction result: host records preserve sanitized `HOME_DASHBOARD` JSON and never request protocol payload logging; logs are ignored by Git.
- Production no-emission result: application logger remains disabled when `__DEV__ === false`; host files are not packaged by the app.
- Captured session path: `logs/android-20260824-205530.log` and `logs/latest.log`.

## Target-dependent checks

- Completed: deterministic Node tests, script syntax checks, current official command-line tools, Android 36 Google APIs x86_64, dedicated AVD boot, native build/install/launch, real archive/latest capture, and LAN failure diagnostics.
- `PENDING NETWORK` (non-blocking): optional `expo-doctor` registry check.

## Discovered specification or architecture issues

- SRS issues: None
- SAD issues: None

## Unchanged-behavior audit

- [x] No production telemetry, remote logging, or persistent in-app diagnostic history added.
- [x] No credential, credential-bearing path, payload, signing material, or household data logged by the runner contract.
- [x] No device protocol, retry, timeout, read-back, lifecycle, or state-publication semantics changed.
- [x] No single-bridge, local-only networking, persistence, or UI requirement changed.
- [x] Existing SDK/AVDs were not deleted, renamed, or overwritten; the modern tools prerequisite was not silently substituted with legacy tools.
- [x] The unrelated `.gitignore` entry for `notes.md` was preserved.

## Remaining work and handoff notes

- What now exists: setup/preflight/session commands and pure helpers in the two scripts above.
- Files/interfaces/commands the next phase should rely on: `npm run dev:android:check`, `npm run setup:android`, `npm run dev:android`; session records use `runner`, `expo`, and `device` sources.
- Remaining findings/checks: none for the required Android workflow; the optional registry-backed doctor check remains network-gated.
- Exact next command: `npm run dev:android`.

## Exit-criteria confirmation

- [x] All three package commands and repository scripts exist and automated runner tests pass.
- [x] README commands match `package.json` and the current app architecture.
- [x] `logs/` is ignored and unrelated `.gitignore` content is preserved.
- [x] Setup and runner target selection/log scoping/cleanup are deterministic by local tests.
- [x] Target workflow completed and evidence handed to Phase 04.
- [x] No production logging/history, web work, or protocol changes were introduced.
- [x] Evidence is persisted and no issue is silently deferred.
