# Phase 01 — Development Logging Contract — `local_running_and_logs`

## Plan

`local_running_and_logs`

## Objective

Create and prove one development-only structured logging boundary that produces bounded, machine-readable, credential-safe console events and emits nothing in production mode.

## Findings addressed

- Primary: `SUP-004`
- Supporting preparation: `SUP-003`, `SUP-005`

## Relevant authority

- SRS: `PRIV-001`, `PRIV-002`, `SEC-002`, `SEC-006`, `REL-006`
- Acceptance: `AC-PRIV-001`, `AC-PRIV-002`, `AC-SEC-002`, `AC-SEC-006`, `AC-REL-006`
- SAD: `security_architecture`, `logging_and_diagnostics`, `verification_architecture`

No authority revision is expected. If safe useful logging appears to require payload dumps, production persistence, or remote transport, stop and flag an SRS/SAD issue.

## Existing evidence

- `src/protocol/hue/redaction.ts` protects credential-bearing Hue paths and selected inline authorization fields.
- `src/app/diagnostics.ts` bounds selected current-diagnostic strings to 240 characters.
- No active structured logger or recursive metadata policy exists.
- `SEC-002` expressly covers production logs, exported diagnostics, and surfaced exception messages.

## In scope

- Add `src/app/developmentLogger.ts` as the only structured development-event emitter.
- Reuse `redactDiagnosticMessage()` for every string value, then apply structured sensitive-key replacement and bounds.
- Define stable internal types for levels (`debug`, `info`, `warn`, `error`) and JSON-compatible sanitized metadata.
- Emit exactly one console call per record with prefix `HOME_DASHBOARD ` followed by valid single-line JSON.
- Add focused tests under `test/app/logging/`.

## Out of scope

- Instrumenting runtime operations; Phase 02 owns event placement.
- Host file creation, ADB, Logcat, emulator setup, or process orchestration.
- Production telemetry, persistent in-app history, exported diagnostics, cloud logging, or UI changes.
- Expanding current diagnostic categories or changing protocol errors.

## Expected repository changes

- Create `src/app/developmentLogger.ts`.
- Update exports only if tests or application modules require an internal app-layer export; do not expose a public user API.
- Create `test/app/logging/developmentLogger.test.ts`.
- Create `implementation_evidence/supplemental-phase-01.md`.

## Required behavior

- Records contain `timestamp`, `level`, `event`, and optional sanitized `context`.
- Event names are stable lowercase dot-separated identifiers; reject or normalize invalid names deterministically.
- In production (`__DEV__ === false`), the logger performs no console emission and no side effect.
- Sensitive keys are matched case-insensitively, including at least `authorization`, `credential`, `username`, `user`, `token`, `password`, `secret`, `apiKey`, and equivalent separators/casing; their values become `<redacted>` without traversal.
- Every string, including keys retained as values and error messages, passes through existing Hue credential redaction.
- Error objects retain only safe bounded fields useful for diagnosis: name, message, string/number code, and diagnostic category. Do not emit raw stacks or enumerable error internals.
- Bound strings to 240 characters, object depth to 4, arrays to 20 entries, and object keys to 30 entries. Mark truncation explicitly and deterministically.
- Handle `undefined`, functions, symbols, bigints, non-finite numbers, dates, and circular references without throwing.
- Do not log payloads merely because the sanitizer could redact them. The logger contract is defense in depth, not permission to pass device/configuration objects.
- Preserve current production runtime behavior and existing diagnostic redaction behavior.

## Tests and verification

Add automated cases for:

- valid one-line JSON with prefix, timestamp, level, event, and scalar context;
- `/api/SECRET/...`, inline `username=SECRET`, and mixed-case sensitive keys at multiple nesting levels;
- credentials nested in arrays and Error messages;
- error field allowlist and absence of stack/raw enumerable values;
- depth, array, key-count, and string bounds;
- circular and unsupported values without logger failure;
- production-mode no emission;
- no mutation of caller-owned metadata.

Use synthetic secrets only and assert the complete captured output does not contain them.

## Commands/checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/logging/developmentLogger.test.ts test/app/provisioning/diagnostics.test.ts test/protocol/hue/core/resultClassifier.test.ts
npm run check:fixture-secrets
git diff --check
```

## Evidence

Create `implementation_evidence/supplemental-phase-01.md`. It must identify `local_running_and_logs` and record:

- work completed and `SUP-004` as the primary finding;
- exact tests/results and representative sanitized record shape using synthetic values;
- files materially changed;
- confirmation that production mode emits nothing;
- remaining target-gated checks (expected: Phase 04 Android checks);
- discovered SRS/SAD issues or `None`;
- handoff notes naming the logger API Phase 02 should use.

## Exit criteria

- [ ] The single structured development logger and sanitizer exist.
- [ ] All secret/redaction/bounding/no-emission tests pass.
- [ ] Existing diagnostic redaction regressions pass.
- [ ] No runtime operation instrumentation or host tooling is pulled forward.
- [ ] Evidence is persisted and no issue is silently deferred.
