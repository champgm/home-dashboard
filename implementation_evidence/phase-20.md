# Phase 20 — Scenes and Sensors UI

- Status: **SUPERSEDED — LOCAL GAPS RECTIFIED; TARGET ACCEPTANCE PENDING**
- Revision under review: working tree (no commit created by this task).
- Date: 2026-08-25.

Rectification update: the pre-rectification Scene/Sensor/Search gaps are closed by [rectification phases 04 and 05](./nonconformance_rectification_plan/final-traceability-status.md). The original baseline text below is retained as audit history; physical-device acceptance remains pending.

## Work completed

- Implemented Scene activation/list wiring and limited Sensor list/name/enable/delete wiring in the modern Expo/RN architecture.
- A 2026-08-25 source audit found that Scene forms/per-light state and the required Sensor catalog, inspection/configuration editor, supported creation forms, partial-update enforcement, search-status lifecycle, and focused tests are incomplete. See [Hue management](../docs/nonconformance/hue-resource-management.md) and [Sensor/dimmer](../docs/nonconformance/sensor-and-dimmer.md).

## Requirement IDs addressed

- Primary: `FR-009`
- Supporting: `FR-008`, `FR-010`, `FR-011`, `FR-012`, `FR-013`, `HUE-006`, `HUE-007`, `HUE-015`, `QA-001`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-FR-009` | BLOCKED — TARGET | local source/tests; final target status in [final-traceability-status.md](./final-traceability-status.md) |
| `AC-FR-013` | PASS — LOCAL; TARGET PENDING | [rectification phases 04 and 05](./nonconformance_rectification_plan/final-traceability-status.md) |
| `AC-HUE-006` | PASS — LOCAL; TARGET PENDING | [rectification phase 04](./nonconformance_rectification_plan/phase-04.md) |
| `AC-HUE-007` | PASS — LOCAL; TARGET PENDING | [rectification phase 05](./nonconformance_rectification_plan/phase-05.md) |
| `AC-HUE-015` | PASS — LOCAL; TARGET PENDING | [rectification phase 05](./nonconformance_rectification_plan/phase-05.md) |

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

- Live-bridge Sensor create/configure/delete exercises and Pixel foreground/background search behavior remain pending, after the local gaps are closed.

## Deviations or discovered specification problems

- No SRS/SAD contradiction was found. The implementation does not yet meet existing `FR-013`, `HUE-007`, `HUE-015`, or the Sensor portions of the phase plan; see the focused conformance-gap document.

## Scope check

- No cloud/analytics/discovery/arbitrary request surface or durable remote-operation journal was added.
- DG-001..DG-006 were not reopened.

## Handoff notes for next phase

- Modern runtime entry is `App.tsx` → `src/ui/App.tsx` → `src/ui/navigation/AppNavigation.tsx`.
- Protocols remain isolated behind `ApplicationService`; local persistence is `ConfigStore`, protected Hue state is `CredentialStore`.
- Pending local work: none for `NC-HUE-004`, `NC-HUE-005`, or `NC-HUE-009`; see the rectification handoffs.
- Pending target work: live Sensor-form and foreground-search acceptance after local completion.
