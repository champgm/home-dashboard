# Phase 02 — Runtime Event Instrumentation — `local_running_and_logs`

## Plan

`local_running_and_logs`

## Objective

Make a captured development session explain startup/readiness, foreground lifecycle, device-operation outcome/timing, provisioning/reauthorization outcome, and current-diagnostic transitions without changing application behavior or exposing protected data.

## Findings addressed

- Primary: `SUP-003`
- Supporting verification: `SUP-004`, `SUP-005`

## Relevant authority

- SRS: `REL-001`, `REL-002`, `REL-003`, `REL-006`, `REL-007`, `REL-008`, `SEC-002`, `QA-003`
- Acceptance: `AC-REL-001`, `AC-REL-002`, `AC-REL-006`, `AC-REL-007`, `AC-REL-008`, `AC-SEC-002`, `AC-QA-003`
- SAD: `ADR-007`, `ADR-008`, `ADR-019`, `startup_and_readiness`, `shutdown_and_backgrounding`, `logging_and_diagnostics`, `state_and_concurrency`

## Existing evidence

- `ApplicationService.withDeadline()` centrally classifies and times most Hue and TP-Link operations but emits no event.
- `ApplicationService.setDiagnostic()` / `clearDiagnostic()` maintain bounded current state without logging transitions.
- `bootstrapApplication()` determines config/binding status and readiness without a capturable trace.
- `LifecycleController` controls foreground/background refresh and abandonment without a capturable trace.
- Provisioning and reauthorization cross the runtime boundary outside the centralized deadline helper.

## In scope

- Instrument the active app path only: bootstrap/runtime facade, lifecycle controller, centralized operation wrapper, and diagnostic set/clear boundary.
- Use the Phase 01 logger; do not create secondary logging helpers or direct ad hoc `console.*` calls.
- Add focused application and lifecycle tests that capture sanitized structured events.
- Log bootstrap failure before rethrowing so existing failure behavior remains unchanged.

## Out of scope

- Protocol request/response body logging or transport wire traces.
- Instrumenting inactive legacy `src/hue/**`, `src/models/**`, or `src/tabs/**` code.
- Changing timeout, retry, read-back, state publication, foreground, provisioning, or diagnostic-map semantics.
- Adding log history to `ApplicationService`, AsyncStorage, SecureStore, the UI, or production builds.
- Host runner and emulator work.

## Expected repository changes

- Update `src/app/ApplicationService.ts`, `src/app/bootstrap.ts`, and `src/app/LifecycleController.ts`.
- Extend focused tests under `test/app/diagnostics/`, `test/app/lifecycle/`, and provisioning tests as appropriate.
- Create `implementation_evidence/supplemental-phase-02.md`.

## Required behavior

Use these stable event families:

- `bootstrap.started`, `bootstrap.completed`, `bootstrap.failed`
- `lifecycle.foreground`, `lifecycle.background`, `lifecycle.stopped`
- `operation.started`, `operation.completed`
- `diagnostic.set`, `diagnostic.cleared`
- `provisioning.completed`, `reauthorization.completed`

Required event context:

- Bootstrap completion: readiness plus config-load and protected-binding status; boolean/count summaries only. Never include configuration, binding, credential, alias, Favorite, or device-state objects.
- Lifecycle: prior/next state and generation where useful; do not add new lifecycle transitions.
- Operation start/completion: operation name, safe resource identifier if already part of the diagnostic contract, result kind, elapsed milliseconds, and diagnostic category/protocol/status code where available.
- Diagnostic set/clear: stable diagnostic key, category, operation, and bounded safe detail fields. Emit `diagnostic.cleared` only when an entry existed.
- Provisioning/reauthorization: result kind, diagnostic category, operation, and elapsed time; never bridge credentials or returned binding objects.

Additional constraints:

- Every begun centralized operation produces one terminal completion event for success, definite failure, ambiguous, partial failure, abandoned, or timeout.
- Do not emit raw operation return values, mutation payloads, bridge snapshots, plug sysinfo, configuration, Favorites, or errors.
- Periodic refresh events may repeat, but each record is bounded and session-only; do not add in-app accumulation.
- Logging failures must never alter command classification, throw into application flow, or prevent cleanup.
- Existing Advanced diagnostics, Unknown behavior, and clear-on-recovery behavior remain unchanged.

## Tests and verification

Add or extend automated cases for:

- successful centralized read/write produces start + one completion with elapsed time;
- timeout, definite failure, ambiguous, partial failure, and foreground abandonment retain the correct result/category;
- thrown errors yield useful sanitized cause fields and no synthetic credentials;
- diagnostic replacement remains one map entry while logging a transition; recovery clears only the matching diagnostic;
- bootstrap records absent/present/error statuses without binding/config contents and logs failure before rethrow;
- foreground/background events correspond to existing refresh/abandonment behavior;
- provisioning and reauthorization log result metadata without returned binding secrets;
- existing lifecycle, command-semantics, diagnostics, provisioning, and reauthorization suites remain unchanged semantically.

## Commands/checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/diagnostics test/app/lifecycle test/app/commands test/app/provisioning test/app/reauthorization.test.ts
npm run test:ci
npm run check:fixture-secrets
git diff --check
```

## Evidence

Create `implementation_evidence/supplemental-phase-02.md`. It must identify `local_running_and_logs` and record:

- `SUP-003` as the primary finding and `SUP-004` verification status;
- event families implemented and exact tests/results;
- representative synthetic success/failure/recovery records;
- a scan/assertion showing synthetic credentials are absent;
- files materially changed and unchanged runtime semantics;
- remaining Phase 03/04 target checks;
- discovered SRS/SAD issues or `None`;
- handoff notes describing the `HOME_DASHBOARD` prefix consumed by Phase 03.

## Exit criteria

- [ ] Required active-runtime event families exist and are development-only.
- [ ] Representative terminal outcomes are useful and secret-safe.
- [ ] Current diagnostic ownership, lifecycle, deadlines, and protocol behavior are unchanged.
- [ ] Full Jest and TypeScript regressions pass.
- [ ] Host/emulator orchestration has not been pulled into this phase.
- [ ] Evidence is persisted and no issue is silently deferred.
