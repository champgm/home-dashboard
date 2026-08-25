# Phase 01 — Development Logging Contract

## Plan

`local_running_and_logs`

## Phase

- Phase: `01 — DEVELOPMENT LOGGING CONTRACT`
- Status: `COMPLETE`
- Commit/revision: working tree; no commit was created by this task
- Date: 2026-08-24

## Work completed

- Added one development-only `HOME_DASHBOARD ` structured logger with stable levels and normalized event names.
- Added recursive metadata sanitization with sensitive-key replacement, Hue credential/path redaction, error allowlisting, circular-value handling, and deterministic bounds.
- Added focused tests for scalar records, nested credentials, errors, unsupported values, bounds, caller immutability, and production no-emission behavior.

## Findings addressed

### Primary

- `SUP-004`

### Supporting verification

- `SUP-003`, `SUP-005`

## Relevant authority exercised

- SRS requirements: `PRIV-001`, `PRIV-002`, `SEC-002`, `SEC-006`, `REL-006`
- SRS acceptance criteria: `AC-PRIV-001`, `AC-PRIV-002`, `AC-SEC-002`, `AC-SEC-006`, `AC-REL-006`
- SAD sections/ADRs: `security_architecture`, `logging_and_diagnostics`, `verification_architecture`

## Tests and checks executed

```text
npx jest --runInBand --coverage=false test/app/logging/developmentLogger.test.ts test/app/logging/runtimeEvents.test.ts
PASS — 2 suites, 11 tests.
npm run typecheck
PASS.
npm run check:fixture-secrets
PASS — characterization fixture secret scan passed.
git diff --check
PASS.
```

Representative sanitized record shape:

```text
HOME_DASHBOARD {"timestamp":"2026-08-24T00:00:00.000Z","level":"warn","event":"operation.completed","context":{"operation":"Hue snapshot","resultKind":"definite_failure","category":"NetworkUnavailable","cause":"<redacted>"}}
```

Synthetic credential values supplied to tests were absent from the complete captured output. Error output retained only `name`, `message`, string/number `code`, and diagnostic `category`; raw stacks and enumerable error internals were absent. With `__DEV__ === false`, the logger returned before timestamping, sanitizing, or calling a console method.

## Files materially changed

- `src/app/developmentLogger.ts`
- `src/app/index.ts`
- `src/protocol/hue/redaction.ts`
- `test/app/logging/developmentLogger.test.ts`
- `test/app/logging/runtimeEvents.test.ts`

## Logging and diagnostic evidence

- Operation/failure mode exercised: success, credential-bearing failure text, oversized/nested metadata, circular values, and unsupported JavaScript values.
- Location/context retained: operation name and bounded safe context only.
- Useful underlying cause retained: bounded sanitized error/diagnostic cause.
- Bounds/redaction result: 240-character strings, depth 4, 20 array entries, 30 object keys, sensitive keyed values replaced with `<redacted>`.
- Production no-emission result: PASS.
- Captured session path, if applicable: Not applicable; host session capture belongs to Phase 03.

## Target-dependent checks

- Completed: local logger and security checks.
- `PENDING TARGET`: real Android Logcat/package inspection remains for Phase 04.

## Discovered specification or architecture issues

- SRS issues: None
- SAD issues: None

## Unchanged-behavior audit

- [x] No production telemetry, remote logging, or persistent in-app diagnostic history added.
- [x] No credential, credential-bearing path, payload, signing material, or household data logged.
- [x] No device protocol, retry, timeout, read-back, lifecycle, or state-publication semantics changed by this phase.
- [x] No single-bridge, local-only networking, persistence, or UI requirement changed.
- [x] No existing SDK/AVD or unrelated working-tree change was deleted/overwritten.
- [x] No later-phase host work was pulled into the logger boundary.

## Remaining work and handoff notes

- What now exists: `emitDevelopmentEvent(level, event, context?)`, `formatDevelopmentLog(...)`, and `sanitizeDevelopmentMetadata(...)` in `src/app/developmentLogger.ts`.
- Files/interfaces/commands the next phase should rely on: use `emitDevelopmentEvent`; do not call `console.*` directly from active runtime code. The prefix is `HOME_DASHBOARD `.
- Remaining findings/checks: Phase 02 runtime placement, then Phase 03 host capture and Phase 04 target acceptance.
- Exact next command: implement and test active runtime event placement, then run `npm run test:ci`.

## Exit-criteria confirmation

- [x] Scoped remediation is implemented.
- [x] Focused and regression tests pass.
- [x] Evidence is persisted and identifies `local_running_and_logs`.
- [x] No unresolved issue is silently deferred.
- [x] Phase ends at a clean review boundary.
