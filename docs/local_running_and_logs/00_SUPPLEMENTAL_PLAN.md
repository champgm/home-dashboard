# Supplemental Phased Implementation Plan — `local_running_and_logs`

## Plan

`local_running_and_logs`

## Purpose and authority

This supplemental plan adds a reproducible PC-hosted Android development workflow and credential-safe development-session logging. It addresses post-implementation observability and integration deficiencies only; it does not re-plan Home Dashboard or change product behavior.

- SRS authority: `docs/SRS_2.2.0.yaml`
- SAD authority: `docs/SAD_2.2.0.yaml`
- Actual implementation: the current repository, especially `package.json`, `README.md`, `App.tsx`, `src/app/**`, `src/protocol/**`, `scripts/**`, and the current tests
- Prior remediation evidence: `implementation_evidence/ui-provisioning-remediation-2.2.0/**`

The selected solution is development-only. The Android app runs in a phone-sized emulator on the PC, while a host process captures Expo/Metro and app-scoped Logcat output into ignored project-local session files. The application does not gain production telemetry, cloud logging, exported diagnostics, or persistent in-app diagnostic history.

## Current-state summary

- The active application is Expo SDK 57 / React Native 0.86 and uses native `react-native-tcp-socket`; a web browser is not a faithful TP-Link test target.
- `package.json` can start Expo or run Android, but has no supported emulator-provisioning, preflight, or file-capture command.
- `README.md` names nonexistent scripts (`startlocal`, `startlan`, and `emulator`) and describes obsolete configuration.
- The active runtime maintains bounded current diagnostics for the UI but does not emit a structured development event stream that can be correlated across startup, lifecycle, device operations, and failures.
- Existing Hue redaction protects current diagnostic strings, but no general structured-log sanitizer handles nested metadata, sensitive field names, errors, or output bounds.
- The current PC has Android SDK/platform/build tools and one Wear OS AVD, but no phone system image/AVD. Its legacy `tools/bin/avdmanager` fails under Java 21, so modern Android command-line tools are a host prerequisite.
- The repository test baseline observed while preparing this plan is 25 Jest suites / 92 tests passing, and `npm run typecheck` passes.

## Authority interpretation

The work is supported by `SEC-002`, `REL-006`, `REL-008`, `QA-002`, and `QA-003`, plus SAD sections `selected_platform`, `logging_and_diagnostics`, `security_architecture`, `android_network_configuration`, and `verification_architecture`.

Two boundaries are mandatory:

1. SAD `logging_and_diagnostics` prohibits persisted diagnostic history in the production application. Session files therefore belong to the development host and are never written by or packaged with the Android app.
2. SRS `PRIV-001`, `PRIV-002`, and `SEC-002` prohibit telemetry and credential leakage. Structured events are development-only, local-console output and must pass through one tested sanitizer.

No SRS or SAD revision is required for this scoped solution. If implementation discovers that useful diagnosis requires production-persisted/exportable history, remote logging, payload dumps, or a different runtime topology, stop and record the applicable SRS/SAD issue rather than adding it silently.

## Execution rules

1. Execute Phases 01–04 sequentially; each is a commit/review boundary.
2. Read this file, `00_FINDINGS_MAP.md`, the phase file, the authoritative SRS/SAD sections, and the previous phase evidence before implementation.
3. Keep all application logging development-only. Do not weaken the existing current-diagnostic map or Advanced diagnostics UI.
4. Do not log Hue credentials, credential-bearing paths, request/response payloads, bridge snapshots, device state, Favorites, aliases, configuration objects, or signing material.
5. Do not modify the device protocol, retry, timeout, foreground, state-publication, provisioning, or reauthorization semantics merely to improve logs.
6. Do not delete or replace existing Android SDKs/AVDs. Host setup may add a modern command-line-tools installation, one system image, and one dedicated AVD.
7. Preserve unrelated working-tree changes, including the existing `.gitignore` addition for `notes.md`.
8. Each phase writes `implementation_evidence/supplemental-phase-XX.md` using `99_PHASE_HANDOFF_TEMPLATE.md` and identifies `local_running_and_logs` exactly.

## Phase index

| Phase | Objective | Primary findings | Depends on |
|---:|---|---|---|
| 01 | Establish a bounded, credential-safe development logging contract | `SUP-004` | none |
| 02 | Emit useful structured runtime, lifecycle, operation, and diagnostic events | `SUP-003` | 01 |
| 03 | Provision a phone emulator and capture reproducible project-local sessions | `SUP-001`, `SUP-002`, `SUP-006` | 02 |
| 04 | Verify every finding through regression and Android target checks | `SUP-005` | 01–03 |

Every actionable finding has exactly one primary phase owner. Supporting phases may verify a finding but must not claim primary ownership.

## Verification expectations

Repository-level checks:

```sh
npm run typecheck
npm run lint
npm run test:ci
npm run check:fixture-secrets
node --test test/scripts/androidDevelopment.test.mjs
python3 docs/validate_home_dashboard_docs_2.2.0.py
git diff --check
```

Commands added by this supplemental effort:

```sh
npm run setup:android
npm run dev:android:check
npm run dev:android
```

The exact new script names above are the public developer workflow; phases must not invent alternatives.

## Target-gated checks

The following require the Linux Android host and are closed in Phase 04:

- download/installation of current official Android command-line tools and the Android 36 Google APIs x86_64 phone image;
- creation and boot of `Home_Dashboard_API_36` using a Pixel-class phone profile;
- native `expo run:android` build/install/launch on that emulator;
- verification that `logs/latest.log` and an archived session contain runner, Metro, structured JavaScript, and app-scoped native Logcat records;
- LAN observation of at least one safe Hue or TP-Link failure from the emulator when the household network/devices are available.

If Android SDK network access, virtualization, ADB permissions, or household LAN access is unavailable, record the precise command/error as `PENDING TARGET` or `BLOCKED — TARGET`; do not report the target check as passed.

## Context-pressure rationale

The plan deliberately separates:

- sanitizer/format contract from runtime instrumentation;
- application instrumentation from host SDK/emulator/process orchestration;
- deterministic local tests from the real emulator and LAN acceptance pass.

This keeps each coding-LLM phase focused on one technical model and prevents host-tooling concerns from obscuring security-critical log behavior.

## Completion protocol

`local_running_and_logs` is complete only when all `SUP-xxx` rows are verified, Phases 01–04 have evidence, target-gated results are explicit, and `implementation_evidence/final-supplemental-status.md` records the final outcome. No unresolved SRS/SAD issue may be silently deferred.
