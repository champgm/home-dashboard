# Phase 08 — Hue Sensors and Search Protocol

- Status: **SUPERSEDED — LOCAL GAPS RECTIFIED; TARGET ACCEPTANCE PENDING**
- Revision under review: working tree (no commit created by this task).
- Date: 2026-08-25.

Rectification update: the pre-rectification local gaps are closed by [rectification phase 05](./nonconformance_rectification_plan/phase-05.md). The original baseline text below is retained as audit history; physical sensor/search acceptance remains pending.

## Work completed

- Implemented Sensor collection parsing, basic enabled-state intent, and search status-before-start protocol checks.
- Sensor field/configuration routing and create/update serializers are incomplete; foreground active-search polling/feedback is absent. See [Sensor/dimmer nonconformance](../docs/nonconformance/sensor-and-dimmer.md).

## Requirement IDs addressed

- Primary: `HUE-007`, `HUE-015`
- Supporting/acceptance handoff: `AC-HUE-007`, `AC-HUE-015`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-007` | PASS — LOCAL; TARGET PENDING | [rectification phase 05](./nonconformance_rectification_plan/phase-05.md) covers typed Sensor forms/configuration and focused tests |
| `AC-HUE-015` | PASS — LOCAL; TARGET PENDING | [rectification phase 05](./nonconformance_rectification_plan/phase-05.md) covers feedback, status gating, and lifecycle polling |

## Tests and checks executed

```text
`npm run typecheck` — PASS.
`npm run lint` — PASS (same strict TypeScript gate).
`npm run test:ci` — PASS (15 suites, 43 tests).
`npm run check:fixture-secrets` — PASS.
`git diff --check` — PASS.
```

## Files materially changed

- `package.json`, `package-lock.json`, `app.json`, `eas.json`, `plugins/withAndroidHardening.js`
- `src/app/`, `src/config/`, `src/protocol/hue/`, `src/protocol/tplink/`, `src/storage/`, `src/ui/`
- `test/`, `scripts/check-characterization-secrets.mjs`

## Diagnostics / observability evidence

- Failure mode exercised: storage corrupt/I/O, Hue policy/response redaction, lifecycle abandonment, TP-Link malformed/explicit-error classification, and unknown-state rendering.
- User-visible diagnostic: typed categories including `Timeout`, `ProtocolMalformed`, `ProtocolRejected`, `AuthenticationRejected`, `BridgeIdentityMismatch`, `StorageError`, and `Unknown`.
- Sensitive-data check: sanitized fixture scanner passed; bridge read DTOs and diagnostic/error paths redact credential-bearing identifiers.

## Known limitations

- No live Hue bridge, TP-Link device, Pixel phone, WAN-disabled LAN, EAS signing credential, or release APK was available in this workspace.
- The referenced `home-dashboard-characterization-evidence-1.1.0.tar.gz` is absent from the checkout; fixtures are intentionally sanitized minimal samples and do not claim full 216-resource coverage.

## Target-dependent checks not yet performed

- Live Sensor CRUD/configuration and foreground/background search acceptance remain pending after local completion.

## Deviations or discovered specification problems

- No SRS/SAD contradiction was found. Local implementation is incomplete for existing `HUE-007` and `HUE-015`.

## Scope check

- No cloud/analytics/discovery/arbitrary request surface or durable remote-operation journal was added.
- DG-001..DG-006 were not reopened.

## Handoff notes for next phase

- Modern runtime entry is `App.tsx` → `src/ui/App.tsx` → `src/ui/navigation/AppNavigation.tsx`.
- Protocols remain isolated behind `ApplicationService`; local persistence is `ConfigStore`, protected Hue state is `CredentialStore`.
- Pending local work: none for `NC-HUE-005` or `NC-HUE-009`; see the rectification handoff.
- Pending target work: `AC-HUE-007` and `AC-HUE-015` after local completion.
