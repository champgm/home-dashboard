# Phase 04 — Diagnostics Model and Advanced / Bridge UI

## Phase

- Phase: `04 — Diagnostics Model and Advanced / Bridge UI`
- Status: `COMPLETE`
- Commit/revision: `f1940d6` plus working-tree remediation changes
- Date: `2026-08-23`

## Work completed

- Replaced seven Hue resource-family diagnostic entries with one stable `hue:bridge` current snapshot diagnostic.
- Added stable `plug:<endpoint-id>` diagnostics with independent clear-on-recovery behavior.
- Kept `hue:provisioning` separate from bridge snapshot diagnostics.
- Preserved typed error detail through `ApplicationService.withDeadline()`.
- Rebuilt `DiagnosticsPanel` to render stable, bounded category/operation/endpoint/timing/status/protocol/detail fields without array-index identity or raw payloads.
- Added tests for Hue de-duplication/clear, per-plug attribution/recovery, provisioning coexistence, and panel output.

## Requirement IDs addressed

### Primary

- `REL-008`
- `FR-006`

### Supporting

- `REL-006`, `SEC-002`, `FR-001`, `FR-002`, `PRIV-001`, `PRIV-002`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-REL-008` | PASS | `test/app/diagnostics/diagnostics.test.ts` verifies one Hue key, one plug key per endpoint, and clear-on-recovery |
| `AC-REL-006` | PASS | typed categories/details remain available in diagnostics mapping tests |
| `AC-FR-006` | PASS | Advanced screen consumes the ApplicationService current diagnostic map; panel test covers rendered surface |
| `AC-SEC-002` | PASS | diagnostic redaction tests and bounded panel fields contain no credential-bearing path/payload |

## Tests and checks executed

```text
npm run typecheck — PASS.
npm run test:ci -- test/app/diagnostics test/ui/diagnostics — PASS (2 suites, 5 tests).
```

## Files materially changed

- `src/app/ApplicationService.ts`
- `src/ui/components/DiagnosticsPanel.tsx`
- `test/app/diagnostics/diagnostics.test.ts`
- `test/ui/diagnostics/DiagnosticsPanel.test.tsx`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-04.md`

## Diagnostics / observability evidence

- Failure mode exercised: failed Hue snapshot with seven resource families, two independent plug failures, one plug recovery, and provisioning/bridge diagnostic coexistence.
- User-visible output: Advanced diagnostics identify category, operation, endpoint, timing, safe status/protocol code, and bounded description.
- Technical detail retained: stable diagnostic key, resource/endpoint, elapsed time, HTTP/protocol metadata, and safe detail.
- Sensitive-data/redaction result: panel consumes already-redacted `Diagnostic` fields and never renders raw response/request data.

## Visual evidence, if applicable

- Not target visual sign-off; the panel component tests pass. Pixel visual diagnostics review remains Phase 08.

## Known limitations

- Safe-area and tile work are separate phases.
- Physical unreachable/recovery checks remain target-gated.

## Target-dependent checks not yet performed

- `PENDING TARGET`: live Advanced diagnostics on Pixel/Hue/plug endpoints.

## Deviations or discovered specification problems

- None.

## Scope check

- [x] No bridge-switch/multi-bridge behavior added.
- [x] No durable operation journals added.
- [x] No cloud/remote diagnostics added.
- [x] No obsolete legacy UI runtime imported into the active app.
- [x] No later-phase work pulled forward without justification.

## Handoff notes

- What now exists: stable current diagnostic ownership and a bounded Advanced diagnostics renderer.
- Files/interfaces next phase should rely on: `ApplicationService.getDiagnostics/setDiagnostic/clearDiagnostic`, diagnostic keys `hue:bridge`, `hue:provisioning`, `plug:<id>`, and `DiagnosticsPanel`.
- Pending target-gated work: live diagnostic recovery review in Phase 08.
