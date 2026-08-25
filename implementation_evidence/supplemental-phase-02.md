# Phase 02 — Runtime Event Instrumentation

## Plan

`local_running_and_logs`

## Phase

- Phase: `02 — RUNTIME EVENT INSTRUMENTATION`
- Status: `COMPLETE`
- Commit/revision: working tree; no commit was created by this task
- Date: 2026-08-24

## Work completed

- Instrumented bootstrap start/completion/failure with readiness and boolean/count summaries only.
- Instrumented foreground, background, and stopped lifecycle transitions with state and generation context.
- Instrumented the centralized deadline wrapper with one `operation.started` and one terminal `operation.completed` event, including operation, safe resource, result kind, elapsed time, category, protocol/status code, and bounded cause where available.
- Instrumented diagnostic set/replacement/clear transitions, provisioning outcomes, and same-bridge reauthorization outcomes without returned bindings or payloads.
- Preserved current diagnostic ownership and made in-flight operations report `abandoned` when foreground generation changes.

## Findings addressed

### Primary

- `SUP-003`

### Supporting verification

- `SUP-004`, `SUP-005`

## Relevant authority exercised

- SRS requirements: `REL-001`, `REL-002`, `REL-003`, `REL-006`, `REL-007`, `REL-008`, `SEC-002`, `QA-003`
- SRS acceptance criteria: `AC-REL-001`, `AC-REL-002`, `AC-REL-006`, `AC-REL-007`, `AC-REL-008`, `AC-SEC-002`, `AC-QA-003`
- SAD sections/ADRs: `ADR-007`, `ADR-008`, `ADR-019`, `startup_and_readiness`, `shutdown_and_backgrounding`, `logging_and_diagnostics`, `state_and_concurrency`

## Tests and checks executed

```text
npx jest --runInBand --coverage=false test/app/logging/developmentLogger.test.ts test/app/logging/runtimeEvents.test.ts
PASS — 2 suites, 11 tests.
npm run test:ci
PASS — 27 suites, 103 tests.
npm run typecheck
PASS.
npm run lint
PASS — strict TypeScript gate.
npm run check:fixture-secrets
PASS.
```

Representative synthetic records:

```text
HOME_DASHBOARD {"event":"operation.completed","context":{"operation":"Hue snapshot","resultKind":"success","elapsedMs":4}}
HOME_DASHBOARD {"event":"operation.completed","context":{"operation":"Hue snapshot","resultKind":"definite_failure","category":"NetworkUnavailable","resource":"bridge:<private-ip>","cause":"<redacted>"}}
HOME_DASHBOARD {"event":"diagnostic.cleared","context":{"key":"hue:bridge","category":"NetworkUnavailable"}}
```

The event tests captured complete records and asserted that synthetic credentials were absent. No bridge snapshot, device state, configuration, Favorite, alias, payload, or returned binding was passed to the logger.

## Files materially changed

- `src/app/ApplicationService.ts`
- `src/app/LifecycleController.ts`
- `src/app/bootstrap.ts`
- `test/app/logging/runtimeEvents.test.ts`

## Logging and diagnostic evidence

- Operation/failure mode exercised: success, timeout, definite failure, in-flight foreground abandonment, diagnostic replacement/recovery, and lifecycle transitions.
- Location/context retained: safe operation/resource identifiers already present in diagnostics, plus generation and state names.
- Useful underlying cause retained: category and bounded sanitized cause/detail; elapsed milliseconds are recorded for terminal events.
- Bounds/redaction result: all event context passes through the Phase 01 logger; synthetic credentials were absent.
- Production no-emission result: covered by Phase 01 tests and unchanged by instrumentation.
- Captured session path, if applicable: Not yet available; real capture is target-gated.

## Target-dependent checks

- Completed: local event and regression checks.
- `PENDING TARGET`: real emulator correlation of Expo, JavaScript, and package-scoped native Logcat records remains for Phases 03–04.

## Discovered specification or architecture issues

- SRS issues: None
- SAD issues: None

## Unchanged-behavior audit

- [x] No production telemetry, remote logging, or persistent in-app diagnostic history added.
- [x] No credential, credential-bearing path, payload, signing material, or household data logged.
- [x] Device protocol, retry, deadline, read-back, lifecycle, and state-publication paths remain semantically unchanged.
- [x] No single-bridge, local-only networking, persistence, or UI requirement changed.
- [x] No host emulator orchestration was added to the application runtime.

## Remaining work and handoff notes

- What now exists: stable event families `bootstrap.*`, `lifecycle.*`, `operation.*`, `diagnostic.*`, `provisioning.completed`, and `reauthorization.completed`.
- Files/interfaces/commands the next phase should rely on: `HOME_DASHBOARD ` is the exact line prefix; host capture must preserve the JSON text after its source/timestamp label.
- Remaining findings/checks: `SUP-001`, `SUP-002`, and `SUP-006` host workflow; final Android target acceptance for `SUP-005`.
- Exact next command: `node --test test/scripts/androidDevelopment.test.mjs`.

## Exit-criteria confirmation

- [x] Required active-runtime event families exist and are development-only.
- [x] Representative terminal outcomes are useful and secret-safe.
- [x] Current diagnostic ownership, lifecycle, deadlines, and protocol behavior are unchanged.
- [x] Full Jest and TypeScript regressions pass.
- [x] Host/emulator orchestration was not pulled into this phase.
- [x] Evidence is persisted and no issue is silently deferred.
