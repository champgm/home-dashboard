# Phase 25 — Plug UI and Editor Contract

- Status: **SUPERSEDED — LOCAL GAPS RECTIFIED; TARGET ACCEPTANCE PENDING**
- Revision under review: working tree (no commit created by this task).
- Date: 2026-08-25.

Rectification update: the pre-rectification plug information/energy gaps are closed by [rectification phase 08](./nonconformance_rectification_plan/phase-08.md). The original baseline text below is retained as audit history; physical-model acceptance remains pending.

## Work completed

- Implemented endpoint administration, physical alias update, relay dashboard integration, local-only removal, and overlay persistence.
- Required plug information and energy presentation are absent. See [TP-Link nonconformance](../docs/nonconformance/tplink.md).

## Requirement IDs addressed

- Primary: `FR-013`, `TPL-002`, `TPL-007`, `TPL-009`, `TPL-010`
- Supporting: `TPL-005`, `TPL-006`, `TPL-008`, `AC-FR-013`, `AC-TPL-002`, `AC-TPL-005`, `AC-TPL-007`, `AC-TPL-008`, `AC-TPL-009`, `AC-TPL-010`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-FR-013` | PASS — LOCAL; TARGET PENDING | [rectification phase 08](./nonconformance_rectification_plan/phase-08.md) |
| `AC-TPL-002` | PASS — LOCAL | local source/tests; final target status in [final-traceability-status.md](./final-traceability-status.md) |
| `AC-TPL-007` | BLOCKED — TARGET | local source/tests; final target status in [final-traceability-status.md](./final-traceability-status.md) |
| `AC-TPL-005` | PASS — LOCAL; TARGET PENDING | [rectification phase 08](./nonconformance_rectification_plan/phase-08.md) |
| `AC-TPL-008` | PASS — LOCAL; TARGET PENDING | [rectification phase 08](./nonconformance_rectification_plan/phase-08.md) |
| `AC-TPL-009` | BLOCKED — ADDITIONAL ACCEPTANCE | local source/tests; final target status in [final-traceability-status.md](./final-traceability-status.md) |
| `AC-TPL-010` | BLOCKED — ADDITIONAL ACCEPTANCE | local source/tests; final target status in [final-traceability-status.md](./final-traceability-status.md) |

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

- PENDING TARGET: Pixel 9 Pro/device, Hue bridge, TP-Link, WAN-disabled, signing, or EAS checks remain as applicable; see final traceability.

## Deviations or discovered specification problems

- No SRS/SAD contradiction was found. Existing implementation does not meet `TPL-005`, `TPL-008`, or the associated `FR-013` editor/presentation contract.

## Scope check

- No cloud/analytics/discovery/arbitrary request surface or durable remote-operation journal was added.
- DG-001..DG-006 were not reopened.

## Handoff notes for next phase

- Modern runtime entry is `App.tsx` → `src/ui/App.tsx` → `src/ui/navigation/AppNavigation.tsx`.
- Protocols remain isolated behind `ApplicationService`; local persistence is `ConfigStore`, protected Hue state is `CredentialStore`.
- Pending local work: none for `NC-TPL-001` or `NC-TPL-002`; see the rectification handoff.
- Pending target work: TP-Link/Pixel acceptance after local completion, plus the other target items in final traceability.
