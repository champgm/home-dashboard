# Phase 01 — Authoritative 2.2.0 Spec / Design Revision

## Phase

- Phase: `01 — Authoritative 2.2.0 Spec / Design Revision`
- Status: `COMPLETE`
- Commit/revision: `f1940d6` (working tree at phase completion)
- Date: `2026-08-23`

## Work completed

- Created the approved 2.2.0 SRS and SAD from the 2.1.0 baseline.
- Added `REL-008` for bounded current diagnostics and `UX-VIS-001` for the established legacy tile contract.
- Clarified Hue provisioning as unauthenticated `POST /api`, safe-area ownership, diagnostic keying/clearing, and modern tile construction.
- Added the 2.2.0 validator and adversarial baseline review.
- No source code or runtime dependency was changed in this phase.

## Requirement IDs addressed

### Primary

- `REL-008`
- `UX-VIS-001`
- Clarified `HUE-002`, `QA-001`, `FR-006`, `FR-011`, `UX-DEL-001..003`

### Supporting

- `HUE-012`, `HUE-013`, `REL-006`, `SEC-002`, `FR-001`, `FR-005`, `FR-007..FR-010`, `FR-016`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-002` | NOT RUN | Authority contract clarified; live bridge execution belongs to Phase 08 |
| `AC-QA-001` | NOT RUN | Authority contract clarified; Pixel execution belongs to Phase 08 |
| `AC-REL-008` | NOT RUN | Defined for Phase 04 local tests and Phase 08 integration |
| `AC-UX-VIS-001` | NOT RUN | Defined for Phase 06/07 local tests and Phase 08 visual review |

## Tests and checks executed

```text
python3 docs/validate_home_dashboard_docs_2.2.0.py — PASS; 87 requirements, 87 acceptance criteria, 87 SAD-covered requirements, 0 errors.
git diff --check — PASS.
Adversarial review — PASS: POST /api, no-delete tile/editor delete, credential-safe diagnostics, and safe-area inset boundaries are consistent.
```

## Files materially changed

- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `docs/BASELINE_REVIEW_2.2.0.md`
- `docs/validate_home_dashboard_docs_2.2.0.py`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-01.md`

## Diagnostics / observability evidence

- Failure mode exercised: documentation consistency and authority cross-reference validation.
- User-visible output: none; this phase changes authority documents only.
- Technical detail retained: exact provisioning method/path, diagnostic key ownership, bounded safe fields, and inset/tile decisions.
- Sensitive-data/redaction result: the new contract forbids credentials, usernames, raw payloads, and credential-bearing URLs in diagnostics.

## Visual evidence, if applicable

- Reference: `screenshot1.png`, `screenshot2.png`, `screenshot3.png`, `src/tabs/common/Button.tsx`, `src/tabs/common/Style.ts`.
- New artifact: objective `UX-VIS-001` contract in `docs/SRS_2.2.0.yaml` and ADR-021 in `docs/SAD_2.2.0.yaml`.
- Result: ready for Phase 06/07 component implementation and Phase 08 Pixel review.

## Known limitations

- No source behavior was changed by design; implementation begins after this authority gate.
- Live bridge, Pixel, and signed-APK checks remain target-gated.

## Target-dependent checks not yet performed

- `PENDING TARGET`: Pixel safe-area/tile visual review and live Hue link-button rejection/success.

## Deviations or discovered specification problems

- None. The existing `/api/config` provisioning defect and generic tile/diagnostic behavior are implementation corrections covered by the approved 2.2.0 baseline.

## Scope check

- [x] No bridge-switch/multi-bridge behavior added.
- [x] No durable operation journals added.
- [x] No cloud/remote diagnostics added.
- [x] No obsolete legacy UI runtime imported into the active app.
- [x] No later-phase work pulled forward without justification.

## Handoff notes

- What now exists: approved 2.2.0 SRS/SAD, validator, baseline review, and phase evidence.
- Files/interfaces next phase should rely on: `HueHttpTransport.requestUnauthenticated`, `HueV1Adapter.provision`, `Diagnostic`, `ApplicationService` diagnostic map, `ResourceTile`, and `SafeAreaProvider` integration decisions.
- Pending target-gated work: carried to Phase 08.
