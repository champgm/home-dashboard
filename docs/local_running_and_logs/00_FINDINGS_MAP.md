# Findings Map — `local_running_and_logs`

## Plan

`local_running_and_logs`

This map records only deficiencies addressed by this supplemental effort. It is not a replacement for SRS traceability.

## Findings

### `SUP-001` — No reproducible phone-class Android runtime on the development PC

- **Classification:** integration/tooling deficiency
- **Problem:** The repository lacks a repeatable way to establish a faithful PC-hosted Android target for the native app.
- **Evidence:** The app uses `react-native-tcp-socket`; `package.json` exposes generic Expo commands only. Host inspection found Android platform/build tools but only the Wear OS AVD `Wear_OS_Large_Round`, with no phone system image. The installed legacy `tools/bin/avdmanager` throws `NoClassDefFoundError: javax/xml/bind/annotation/XmlSchema` under Java 21.
- **Expected result:** A documented, idempotent `npm run setup:android` preflights modern tools, installs/uses Android 36 Google APIs x86_64, and creates or reuses `Home_Dashboard_API_36` without altering existing AVDs.
- **Affected subsystem:** development tooling and Android host integration
- **Relevant authority:** SRS `CON-001`, `QA-002`, `QA-003`; SAD `selected_platform`, `ADR-001`, `ADR-004`, `android_network_configuration`
- **Verification:** tool preflight tests plus actual AVD creation, boot, native build, install, and launch
- **Primary implementation phase:** Phase 03

### `SUP-002` — Development sessions are not captured to an inspectable project-local file

- **Classification:** observability deficiency
- **Problem:** Existing Expo/Android commands print transient terminal output only; there is no stable session artifact for later diagnosis or handoff.
- **Evidence:** `package.json` contains no log capture script, `.gitignore` contains no `logs/` rule, and no runner coordinates Expo output with app-scoped Logcat.
- **Expected result:** `npm run dev:android` writes one timestamped archive and `logs/latest.log`, labels sources and timestamps, captures app-native and JavaScript output, and cleans up child processes on interruption.
- **Affected subsystem:** development runner, ADB/Logcat integration, repository hygiene
- **Relevant authority:** SRS `SEC-002`, `REL-006`, `QA-002`; SAD `logging_and_diagnostics`, `security_architecture`, `verification_architecture`
- **Verification:** runner unit tests and an emulator session whose two expected files contain correlated source records and no unrelated-device Logcat stream
- **Primary implementation phase:** Phase 03

### `SUP-003` — Active runtime failures lack a structured development event trail

- **Classification:** observability deficiency
- **Problem:** The current diagnostic map exposes only bounded current UI state. Startup, lifecycle changes, operation timing/outcome, and diagnostic set/clear transitions cannot be reconstructed from a captured development session.
- **Evidence:** `src/app/ApplicationService.ts`, `src/app/bootstrap.ts`, and `src/app/LifecycleController.ts` do not emit structured events. Console calls found elsewhere are in the inactive legacy tree and are not a coherent active-runtime diagnostic pipeline.
- **Expected result:** The active runtime emits stable development-only events for bootstrap/readiness, lifecycle, centralized operations, provisioning/reauthorization outcomes, and diagnostic transitions, including safe cause/category and elapsed context.
- **Affected subsystem:** application orchestration and diagnostics
- **Relevant authority:** SRS `REL-001`, `REL-002`, `REL-006`, `REL-008`, `SEC-002`; SAD `ADR-007`, `ADR-008`, `ADR-019`, `startup_and_readiness`, `logging_and_diagnostics`
- **Verification:** focused tests inspect event names/metadata across success, timeout, definite failure, ambiguous, abandoned, and recovery paths; emulator log inspection confirms correlation
- **Primary implementation phase:** Phase 02

### `SUP-004` — No general safe boundary exists for structured development-log metadata

- **Classification:** security/observability implementation deficiency
- **Problem:** Existing Hue redaction is string-oriented and diagnostic-specific; it does not define recursive metadata sanitization, sensitive-key handling, error serialization, size bounds, or a development-only emission contract.
- **Evidence:** `src/protocol/hue/redaction.ts` redacts Hue API path credentials and selected inline fields, while `src/app/diagnostics.ts` bounds selected diagnostic strings. There is no active structured logger or nested-value policy.
- **Expected result:** One internal development logger recursively sanitizes all metadata, replaces sensitive keyed values, redacts every string, bounds depth/count/length, safely serializes errors, emits one prefixed JSON line, and is inert in production.
- **Affected subsystem:** application logging/security boundary
- **Relevant authority:** SRS `PRIV-001`, `PRIV-002`, `SEC-002`, `SEC-006`, `REL-006`; SAD `security_architecture`, `logging_and_diagnostics`
- **Verification:** deterministic unit tests with synthetic credentials in paths, nested objects, arrays, error fields, circular references, and oversized values; production-mode no-emission test
- **Primary implementation phase:** Phase 01

### `SUP-005` — No end-to-end regression proves logs are both useful and secret-safe

- **Classification:** missing regression/acceptance coverage
- **Problem:** Existing tests cover current diagnostic classification/redaction but not the new structured event stream, host session capture, or correlation on an Android target.
- **Evidence:** Current tests include `test/app/diagnostics/**` and provisioning redaction tests, but no development logger, runner, or captured-session acceptance artifact exists.
- **Expected result:** Final verification traces every finding, proves representative failures communicate operation/location/cause without secrets, and records target results in the mandated evidence files.
- **Affected subsystem:** cross-cutting verification and evidence
- **Relevant authority:** SRS `AC-SEC-002`, `AC-REL-006`, `AC-REL-008`, `AC-QA-002`, `AC-QA-003`; SAD `verification_architecture`
- **Verification:** full automated suite, fixture scanner, runner tests, emulator session inspection, synthetic secret scan, and LAN failure observation where available
- **Primary implementation phase:** Phase 04

### `SUP-006` — Development documentation advertises nonexistent and obsolete commands

- **Classification:** integration/documentation defect
- **Problem:** A maintainer cannot follow the README to start the current application reliably.
- **Evidence:** `README.md` instructs `npm run startlocal`, `npm run startlan`, and `npm run emulator`, none of which exist in `package.json`; it also describes a removed `src/configuration/Hue.ts` flow.
- **Expected result:** README instructions describe the current Expo/native workflow, exact setup/run commands, session log locations, prerequisites, LAN behavior, and actionable failure checks.
- **Affected subsystem:** developer documentation
- **Relevant authority:** SRS `QA-002`, `QA-003`; SAD `selected_platform`, `repository_structure`, `verification_architecture`
- **Verification:** every documented command exists; a clean-shell walkthrough reaches preflight or launch without undocumented repository steps
- **Primary implementation phase:** Phase 03

## Primary ownership audit

| Finding | Primary phase | Supporting verification |
|---|---:|---|
| `SUP-001` | 03 | 04 |
| `SUP-002` | 03 | 04 |
| `SUP-003` | 02 | 04 |
| `SUP-004` | 01 | 02, 04 |
| `SUP-005` | 04 | none |
| `SUP-006` | 03 | 04 |

Each actionable finding has exactly one primary phase owner.

## Specification issue audit

- **SRS issues discovered:** none for the development-only, host-captured approach.
- **SAD issues discovered:** none for the development-only, host-captured approach.
- **Escalation trigger:** production-persisted/exportable history, cloud/remote logging, raw device payload capture, or a new backend/runtime process would exceed this plan and requires explicit SRS/SAD review.
