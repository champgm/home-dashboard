# Phase 07 — Hue Scenes Protocol

- Status: **SUPERSEDED — LOCAL GAP RECTIFIED; TARGET ACCEPTANCE PENDING**
- Revision under review: working tree (no commit created by this task).
- Date: 2026-08-25.

Rectification update: the pre-rectification local gap is closed by [rectification phase 04](./nonconformance_rectification_plan/phase-04.md). The original baseline text below is retained as audit history; only disposable live-bridge acceptance remains pending.

## Work completed

- Implemented Scene parsing, changed-field helpers, and GroupScene/LightScene activation routing.
- No service/adapter operation exposes per-light Scene state updates and the required create/update forms are not exercised. See `NC-HUE-004` in [Hue management nonconformance](../docs/nonconformance/hue-resource-management.md).

## Requirement IDs addressed

- Primary: `HUE-006`
- Supporting/acceptance handoff: `AC-HUE-006`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-006` | PASS — LOCAL; TARGET PENDING | [rectification phase 04](./nonconformance_rectification_plan/phase-04.md) covers forms, per-light routing, and focused tests |

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

- Disposable GroupScene/LightScene live acceptance remains pending after local completion.

## Deviations or discovered specification problems

- No SRS/SAD contradiction was found. Local protocol/UI coverage is incomplete for existing `HUE-006`.

## Scope check

- No cloud/analytics/discovery/arbitrary request surface or durable remote-operation journal was added.
- DG-001..DG-006 were not reopened.

## Handoff notes for next phase

- Modern runtime entry is `App.tsx` → `src/ui/App.tsx` → `src/ui/navigation/AppNavigation.tsx`.
- Protocols remain isolated behind `ApplicationService`; local persistence is `ConfigStore`, protected Hue state is `CredentialStore`.
- Pending local work: none for `NC-HUE-004`; see the rectification handoff.
- Pending target work: `AC-HUE-006` after local completion.
