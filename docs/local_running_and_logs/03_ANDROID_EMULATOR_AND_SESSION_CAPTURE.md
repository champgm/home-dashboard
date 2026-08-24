# Phase 03 — Android Emulator and Session Capture — `local_running_and_logs`

## Plan

`local_running_and_logs`

## Objective

Provide a repeatable PC-hosted phone-emulator workflow in which one command builds/runs the native app and records a correlated, app-scoped session in ignored project-local files.

## Findings addressed

- Primary: `SUP-001`, `SUP-002`, `SUP-006`
- Supporting integration: `SUP-003`, `SUP-004`, `SUP-005`

## Relevant authority

- SRS: `CON-001`, `QA-002`, `QA-003`, `SEC-002`, `PRIV-001`, `PRIV-002`, `REL-006`
- Acceptance: `AC-CON-001` (development-target support only, not physical-phone closure), `AC-QA-002`, `AC-QA-003`, `AC-SEC-002`, `AC-REL-006`
- SAD: `selected_platform`, `ADR-001`, `ADR-003`, `ADR-004`, `android_network_configuration`, `logging_and_diagnostics`, `repository_structure`, `verification_architecture`

## Existing evidence

- The native TP-Link transport makes a browser target insufficient for faithful testing.
- `package.json` lacks emulator setup, preflight, and session capture commands.
- `README.md` documents nonexistent scripts and obsolete configuration.
- Host inspection found SDK platforms 35/36, build-tools 35/36/37, and ADB/emulator binaries, but only a Wear OS image/AVD.
- The legacy `tools/bin/avdmanager` is incompatible with the installed Java 21 runtime; modern `cmdline-tools/latest` is absent.
- `.gitignore` has an unrelated user change for `notes.md` that must be preserved.

## In scope

- Add one-time setup/preflight and development-session runner scripts under `scripts/`.
- Add exact package commands `setup:android`, `dev:android:check`, and `dev:android`.
- Add deterministic Node tests for tool resolution, AVD/device selection, log naming/source labeling, sensitive-output rejection where applicable, and child cleanup logic.
- Add `logs/` to `.gitignore` without disturbing existing edits.
- Rewrite README development instructions for the current application.
- As an explicit host step, install current official Android command-line tools if missing, then provision the dedicated system image/AVD.

## Out of scope

- Web support, desktop-native support, Expo Go support, iOS tooling, or physical-phone automation.
- Deleting/upgrading/replacing unrelated SDK packages or existing AVDs.
- Shipping Android SDK tools, system images, logs, or machine-specific absolute paths in Git.
- Production app file logging, telemetry, log upload, log viewer UI, or protocol payload traces.
- Changing app/device behavior to accommodate emulator networking.

## Expected repository changes

- Create `scripts/setup-android-debug.mjs` and `scripts/run-android-with-logs.mjs`; factor shared pure helpers only if needed for tests.
- Update `package.json`, `.gitignore`, and `README.md`.
- Create `test/scripts/androidDevelopment.test.mjs` for Node's built-in test runner.
- Create `implementation_evidence/supplemental-phase-03.md`.

## Required behavior

### One-time setup

`npm run setup:android` must:

- resolve the SDK from `ANDROID_SDK_ROOT`, then `ANDROID_HOME`, then executable discovery; never commit or print machine secrets;
- require modern `cmdline-tools/latest/bin/sdkmanager` and `avdmanager`; when absent/broken, fail with an exact actionable official-tool installation message rather than using the known-incompatible legacy tools;
- install or verify `platform-tools`, `emulator`, `platforms;android-36`, and `system-images;android-36;google_apis;x86_64`;
- create or reuse `Home_Dashboard_API_36` with a Pixel-class phone profile, x86_64 ABI, portrait orientation, hardware keyboard, and sufficient storage/RAM for the app;
- be idempotent and never delete, rename, or modify `Wear_OS_Large_Round` or other AVDs;
- surface license/network/disk/tool failures with the failed operation and command context.

The executor may install current official command-line tools into the user's Android SDK as a one-time host prerequisite. Record versions and source in evidence; do not automate an unpinned third-party download.

### Preflight

`npm run dev:android:check` must be non-mutating and report:

- resolved Node/npm, Java, SDK, ADB, emulator, sdkmanager/avdmanager, target platform/image, AVD, virtualization, and connected-device state;
- clear PASS/FAIL per prerequisite and the exact next command;
- no ADB daemon startup requirement when a static check is sufficient; if ADB access is attempted and denied, identify it as a host permission issue.

### Session runner

`npm run dev:android` must:

- run preflight, start `Home_Dashboard_API_36` only when no matching instance is available, and wait up to 180 seconds for `sys.boot_completed=1`;
- select the dedicated emulator deterministically and avoid sending install/log commands to a different connected phone/emulator;
- run the repository-local Expo CLI using the existing native `expo run:android` path; do not rely on Expo Go because of native TCP;
- create `logs/android-YYYYMMDD-HHMMSS.log` and truncate/create `logs/latest.log`, duplicating identical session records to both;
- prefix every host record with ISO timestamp and source (`runner`, `expo`, `device`), preserving the Phase 02 `HOME_DASHBOARD` JSON text;
- capture Expo stdout/stderr from process start;
- after the package is installed/known, resolve `com.zhna123.homedashboard.v2` UID and use UID-scoped Logcat with a session-start boundary so early buffered app records and native crashes are included without recording unrelated system/app logs;
- tolerate app PID changes/reloads by using package UID rather than a single PID;
- print both log paths at startup and shutdown;
- on Ctrl+C/SIGTERM, terminate Expo and Logcat children, flush/close files, and leave an emulator started by the session running for fast reuse;
- return nonzero on preflight, boot, build/install, or orchestration failure while preserving the partial log.

### Documentation and security

- README must document prerequisites, one-time setup, daily run, how to inspect/share `logs/latest.log`, AVD reuse, LAN/private-IP behavior, Ctrl+C behavior, and common Java/ADB/virtualization/build failures.
- Explain that logs may contain safe local endpoint/resource identifiers and should still be reviewed before sharing.
- Never place credentials, payloads, signing values, or environment dumps in runner messages.
- Preserve existing package scripts and application behavior unless a stale duplicate is explicitly documented as replaced.

## Tests and verification

Automate pure behavior without requiring an emulator:

- SDK/tool precedence and missing-tool diagnostics;
- exact AVD/image/package constants;
- deterministic selection when unrelated devices are listed;
- session filename format and identical archive/latest writes;
- source labeling for split/partial lines from stdout/stderr;
- signal cleanup and partial-log preservation using fake child processes;
- nonzero propagation for preflight/boot/Expo failure;
- README command-to-`package.json` consistency.

Target-gated in Phase 04:

- modern tool installation, image download, AVD creation/boot;
- native build/install/launch and real UID-scoped Logcat capture.

## Commands/checks

```sh
node --test test/scripts/androidDevelopment.test.mjs
npm run dev:android:check
npm run typecheck
npm run lint
npm run test:ci
npm run check:fixture-secrets
git diff --check
```

Host provisioning/launch commands, when target access is available:

```sh
npm run setup:android
npm run dev:android
```

## Evidence

Create `implementation_evidence/supplemental-phase-03.md`. It must identify `local_running_and_logs` and record:

- `SUP-001`, `SUP-002`, and `SUP-006` as primary findings;
- exact tool/AVD constants and automated test results;
- files materially changed, including preservation of the prior `.gitignore` edit;
- host tool versions and commands actually run, if target work is performed;
- resulting log paths and sanitized excerpts, if available;
- remaining target-gated checks marked precisely;
- discovered SRS/SAD issues or `None`;
- Phase 04 handoff steps.

## Exit criteria

- [ ] All three package commands and repository scripts exist and automated runner tests pass.
- [ ] README commands match `package.json` and the current app architecture.
- [ ] `logs/` is ignored and unrelated `.gitignore` content is preserved.
- [ ] Setup is idempotent and runner target selection/log scoping/cleanup are deterministic.
- [ ] Target work is either completed with evidence or explicitly handed to Phase 04 as `PENDING TARGET`.
- [ ] No production logging/history, web work, or protocol changes are introduced.
- [ ] Evidence is persisted and no issue is silently deferred.
