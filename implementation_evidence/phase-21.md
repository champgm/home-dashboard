# Phase 21 — Rules and Schedules UI

- Status: **SUPERSEDED — LOCAL GAPS RECTIFIED; TARGET ACCEPTANCE PENDING**
- Revision under review: working tree (no commit created by this task).
- Date: 2026-08-25.

Rectification update: the pre-rectification Rule/Schedule gaps are closed by [rectification phases 06 and 07](./nonconformance_rectification_plan/final-traceability-status.md). The original baseline text below is retained as audit history; disposable live-bridge acceptance remains pending.

## Work completed

- Implemented Rule/Schedule list, generic name, status, and delete wiring in the modern Expo/RN architecture.
- A 2026-08-25 source audit found that the Rule editor does not render structured condition/action controls and the Schedule editor does not render time-pattern/command controls. See [Hue management nonconformance](../docs/nonconformance/hue-resource-management.md).

## Requirement IDs addressed

- Primary: `HUE-008`, `HUE-009`
- Supporting: `FR-008`, `FR-013`, `HUE-016`, `QA-001`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| phase-local checks | PASS — LOCAL | shared suite and source inspection |
| `AC-FR-013` | PASS — LOCAL; TARGET PENDING | [rectification phases 06 and 07](./nonconformance_rectification_plan/final-traceability-status.md) |
| `AC-HUE-008` | PASS — LOCAL; TARGET PENDING | [rectification phase 06](./nonconformance_rectification_plan/phase-06.md) |
| `AC-HUE-009` | PASS — LOCAL; TARGET PENDING | [rectification phase 07](./nonconformance_rectification_plan/phase-07.md) |

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

- Disposable live-bridge Rule create/update/enable/disable/delete acceptance remains pending, after the local editor gap is closed.

## Deviations or discovered specification problems

- No SRS/SAD contradiction was found. The Rule/Schedule editors do not yet meet existing `HUE-008`, `HUE-009`, and `FR-013`; see the canonical nonconformance register.

## Scope check

- No cloud/analytics/discovery/arbitrary request surface or durable remote-operation journal was added.
- DG-001..DG-006 were not reopened.

## Handoff notes for next phase

- Modern runtime entry is `App.tsx` → `src/ui/App.tsx` → `src/ui/navigation/AppNavigation.tsx`.
- Protocols remain isolated behind `ApplicationService`; local persistence is `ConfigStore`, protected Hue state is `CredentialStore`.
- Pending local work: none for `NC-HUE-006` or `NC-HUE-007`; see the rectification handoffs.
- Pending target work: disposable live-bridge Rule acceptance after local completion.
