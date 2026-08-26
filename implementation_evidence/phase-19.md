# Phase 19 — Lights and Groups UI

- Status: **SUPERSEDED — LOCAL GAPS RECTIFIED; TARGET ACCEPTANCE PENDING**
- Revision under review: working tree (no commit created by this task).
- Date: 2026-08-25.

Rectification update: the pre-rectification Light/Group gaps are closed by [rectification phase 03](./nonconformance_rectification_plan/phase-03.md). The original baseline text below is retained as audit history; disposable live-bridge acceptance remains pending.

## Work completed

- Implemented Light/Group lists, primary toggles, Name updates, delete, and limited explicit state actions.
- The required Light state/metadata fields and Group membership/class/action editor controls are absent. See `NC-HUE-002` and `NC-HUE-003` in [Hue management nonconformance](../docs/nonconformance/hue-resource-management.md).

## Requirement IDs addressed

- Primary: `HUE-004`, `HUE-005`
- Supporting: `FR-008`, `FR-010`, `FR-011`, `FR-012`, `FR-013`, `FR-016`, `QA-001`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| phase-local checks | PASS — LOCAL | shared suite and source inspection |
| `AC-FR-013` | PASS — LOCAL; TARGET PENDING | [rectification phase 03](./nonconformance_rectification_plan/phase-03.md) covers Light/Group editor controls and boundary tests |
| `AC-HUE-004` | PASS — LOCAL; TARGET PENDING | [rectification phase 03](./nonconformance_rectification_plan/phase-03.md) covers Light fields and capability gating |
| `AC-HUE-005` | PASS — LOCAL; TARGET PENDING | [rectification phase 03](./nonconformance_rectification_plan/phase-03.md) covers Group membership/class/action management |

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

- Live Light and disposable Group acceptance remains pending after local editor completion.

## Deviations or discovered specification problems

- No SRS/SAD contradiction was found. Existing implementation does not meet `FR-013`, `HUE-004`, or `HUE-005`.

## Scope check

- No cloud/analytics/discovery/arbitrary request surface or durable remote-operation journal was added.
- DG-001..DG-006 were not reopened.

## Handoff notes for next phase

- Modern runtime entry is `App.tsx` → `src/ui/App.tsx` → `src/ui/navigation/AppNavigation.tsx`.
- Protocols remain isolated behind `ApplicationService`; local persistence is `ConfigStore`, protected Hue state is `CredentialStore`.
- Pending local work: none for `NC-HUE-002` or `NC-HUE-003`; see the rectification handoff.
- Pending target work: `AC-HUE-004` and `AC-HUE-005` after local completion.
