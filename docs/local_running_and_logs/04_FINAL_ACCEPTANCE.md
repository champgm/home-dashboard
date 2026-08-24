# Phase 04 — Final Acceptance — `local_running_and_logs`

## Plan

`local_running_and_logs`

## Objective

Verify every `local_running_and_logs` finding through full regression checks and a real phone-emulator session, confirm diagnostic usefulness and secret safety, and publish final supplemental status without introducing new implementation except narrowly scoped test/plan corrections discovered during verification.

## Findings addressed

- Primary: `SUP-005`
- Final verification: `SUP-001`, `SUP-002`, `SUP-003`, `SUP-004`, `SUP-006`

## Relevant authority

- SRS: `PRIV-001`, `PRIV-002`, `SEC-002`, `SEC-006`, `REL-001`, `REL-002`, `REL-006`, `REL-007`, `REL-008`, `QA-002`, `QA-003`
- Acceptance: `AC-PRIV-001`, `AC-PRIV-002`, `AC-SEC-002`, `AC-SEC-006`, `AC-REL-001`, `AC-REL-002`, `AC-REL-006`, `AC-REL-007`, `AC-REL-008`, `AC-QA-002`, `AC-QA-003`
- SAD: `selected_platform`, `security_architecture`, `android_network_configuration`, `logging_and_diagnostics`, `verification_architecture`

This phase does not replace existing physical Pixel, release-signing, full Hue, or full TP-Link product acceptance evidence. It verifies the supplemental development workflow and guards against regression of authoritative behavior.

## Existing evidence

- `implementation_evidence/supplemental-phase-01.md`
- `implementation_evidence/supplemental-phase-02.md`
- `implementation_evidence/supplemental-phase-03.md`
- Automated test additions and any Phase 03 target artifacts
- Existing completed 2.2.0 evidence under `implementation_evidence/ui-provisioning-remediation-2.2.0/`

If any prerequisite evidence file is absent or incomplete, stop and return ownership to that phase rather than silently compensating here.

## In scope

- Audit finding-to-phase ownership, SRS/SAD references, file paths, commands, and evidence consistency.
- Run all affected automated regression/security checks.
- Complete current-PC Android SDK/AVD/build/session target checks.
- Exercise safe representative runtime success/recovery and failure paths available without destructive household-device changes.
- Inspect and scan captured logs for diagnostic value, source correlation, bounds, scoping, and credential absence.
- Create final phase evidence and final supplemental status.

## Out of scope

- New feature implementation, logging architecture redesign, unrelated cleanup, or broad refactoring.
- Destructive Hue/TP-Link operations solely to generate logs.
- Repeating the complete main SRS acceptance campaign or replacing physical Pixel evidence.
- Waiving target failures because deterministic tests pass.

## Expected repository changes

- Normally evidence only: `implementation_evidence/supplemental-phase-04.md` and `implementation_evidence/final-supplemental-status.md`.
- Test or documentation corrections are permitted only when directly required to close a `SUP-xxx` finding; record the reason and rerun all checks.

## Required behavior

### Automated regression

- Phase 01 sanitizer/logger tests pass, including production no-emission and complete synthetic-secret absence.
- Phase 02 event tests prove operation/location/useful cause across success, timeout/failure, ambiguous/abandoned, diagnostic set/clear, and startup/lifecycle paths.
- Phase 03 runner tests prove deterministic target selection, app-scoped capture, log preservation, source labeling, and child cleanup.
- Existing current-diagnostic, provisioning, lifecycle, command, Hue, TP-Link, storage, UI, and security tests remain green.

### Android target acceptance

On the current Linux PC:

1. Run `npm run dev:android:check` and record the complete PASS/FAIL summary.
2. If needed, install current official command-line tools, run `npm run setup:android`, and record tool versions/image/AVD without deleting existing SDK state.
3. Run `npm run dev:android`; verify native build, install, launch, and visible app shell on `Home_Dashboard_API_36`.
4. Confirm both the timestamped archive and `logs/latest.log` exist, are nonempty, and contain correlated `runner`, `expo`, `device`, and `HOME_DASHBOARD` records.
5. Background/foreground or reload the app and verify lifecycle and subsequent operation events continue without duplicate in-app history behavior.
6. Exercise a nondestructive representative failure using a configured private unreachable test endpoint or an unavailable household endpoint. Confirm the record states operation, safe resource location, result/category, elapsed time, and useful bounded cause.
7. Where household LAN access is available, exercise one real nondestructive Hue snapshot/provisioning-status or TP-Link read path and confirm emulator LAN reachability behavior. Do not issue destructive operations merely for evidence.
8. Stop with Ctrl+C; verify child capture processes exit, the partial/final log is readable, and the emulator remains available.

### Security inspection

- Seed only synthetic known credentials for automated redaction checks; never place a real credential in an evidence file.
- Scan complete test output and captured development logs for synthetic secrets and credential-bearing `/api/<username>` paths.
- Confirm Logcat is scoped to the Home Dashboard package UID rather than all system applications.
- Inspect the production path/build configuration to confirm structured development events remain disabled and no log files/SDK tooling are packaged.
- Confirm `logs/` artifacts are ignored by Git and excluded from evidence unless excerpts are manually sanitized.

### Unchanged behavior

- No changes to SRS product scope, single-bridge binding, local-only networking, current-diagnostic ownership, foreground-only operation, deadlines/retry/read-back, storage, UI, protocols, or release distribution.
- No production persistent diagnostic history, telemetry, log upload, payload dump, or new backend.

## Tests and verification

Run from repository root:

## Commands/checks

```sh
node --test test/scripts/androidDevelopment.test.mjs
npm run typecheck
npm run lint
npm run test:ci
npm run check:fixture-secrets
npm run doctor
python3 docs/validate_home_dashboard_docs_2.2.0.py
git diff --check
git status --short
```

Target commands:

```sh
npm run dev:android:check
npm run setup:android
npm run dev:android
```

If `npm run doctor` or target setup requires network access, record whether it passed, failed, or remains `PENDING TARGET`; do not silently omit it.

## Evidence

Create both:

- `implementation_evidence/supplemental-phase-04.md`
- `implementation_evidence/final-supplemental-status.md`

Both must identify `local_running_and_logs` and record:

- work/verification completed and all findings checked;
- exact commands, results, test counts, host/tool/AVD versions, and target outcome;
- files materially changed;
- captured log paths plus sanitized representative evidence;
- synthetic-secret and package-scope inspection results;
- remaining target-gated checks, which must be `None` for overall COMPLETE status;
- discovered SRS/SAD issues or `None`;
- final handoff and operational commands.

`final-supplemental-status.md` must include a table with one row per `SUP-001` through `SUP-006`, its primary owner, verification evidence, and `PASS | FAIL | PENDING TARGET | BLOCKED` status.

## Exit criteria

- [ ] Every `SUP-xxx` finding has exactly one primary owner and explicit final status.
- [ ] All automated and regression checks pass.
- [ ] The dedicated phone emulator builds, installs, launches, and produces both required log files.
- [ ] A representative failure communicates operation, location, useful cause, and safe context.
- [ ] Synthetic credential scans and production no-emission/package inspections pass.
- [ ] All target-gated checks are completed; otherwise final status is not COMPLETE.
- [ ] Both evidence files identify `local_running_and_logs` and are persisted.
- [ ] No unintended SRS/SAD or application behavior change was introduced.
