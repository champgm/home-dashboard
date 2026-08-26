# Evidence and Acceptance Nonconformance

Current disposition: `NC-TRACE-001`, `NC-EVID-001`, and `NC-EVID-002` are reconciled by [rectification phases 01 and 10](../../implementation_evidence/nonconformance_rectification_plan/final-traceability-status.md). The machine-readable manifest now requires per-ID source/test evidence and target-pending language; Phase 08 model verification and target-dependent acceptance remain open.

## `NC-TRACE-001` — The main traceability matrix was incomplete

Severity: **High**  
Status: **CLOSED — LOCAL DOCUMENTATION RECTIFIED**

SRS 2.2.0 contains 88 mandatory requirements and 88 acceptance criteria. The main `implementation_evidence/final-traceability-status.md` contained only 85 rows in each section. It omitted:

- `REL-008` / `AC-REL-008`;
- `UX-VIS-001` / `AC-UX-VIS-001`;
- `UX-VIS-002` / `AC-UX-VIS-002`.

The rows are restored by this audit. Their local evidence does not eliminate required live recovery/Pixel visual acceptance.

## `NC-TRACE-002` — Main traceability evidence links were broken

Severity: **Medium**  
Status: **CLOSED — DOCUMENTATION REPAIRED 2026-08-25**

The main matrix linked to paths such as `implementation_evidence/phase-01.md` from a file already inside `implementation_evidence/`. Those paths resolved to a nonexistent nested directory. The audit found and corrected 146 occurrences, then checked every relative Markdown file target in the canonical nonconformance and modified evidence documents.

## `NC-EVID-001` — Phase completion was overstated

Severity: **High**  
Status: **CLOSED — LOCAL DOCUMENTATION RECTIFIED**

Several phase evidence records used generic suite success as proof of phase completion despite absent phase-owned behavior:

- Phase 19: Light/Group editors omit documented management fields and Group membership/action controls.
- Phase 20: Sensor/Scene editors omit Sensor configuration and Scene forms/per-light state.
- Phase 21: Rule/Schedule editors omit structured conditions/actions/time/commands.
- Phase 25: Plug UI omits required returned information and energy presentation.

Phase 20 and 21 previously recorded only Scene or no requirement ownership while declaring their combined phases complete. The affected evidence statuses are corrected to local-incomplete.

## `NC-EVID-002` — Target-blocked status masked local failures

Severity: **Medium**  
Status: **CLOSED — LOCAL DOCUMENTATION RECTIFIED**

An item may be target-blocked only when its local implementation exists. The old traceability marked several criteria target-blocked although local source already prevented acceptance. The historical audit recorded those items as `FAIL — LOCAL; TARGET NOT RUN`; the rectification matrix now records local closure and keeps the genuinely target-dependent work pending.

## Unresolved target and additional acceptance

The final traceability matrix and machine-readable evidence manifest remain the row-level authorities. Required evidence remains unavailable for the Pixel 9 Pro phones, bound Hue bridge, representative HS100/HS103/HS110 plugs, WAN-disabled routing, private signed APK/update behavior, Android backup/transfer behavior, signing-key handling, and the complete household inventory.

Requirements still `BLOCKED — ADDITIONAL ACCEPTANCE`:

`CON-006`, `FR-001`, `FR-014`, `TPL-009`, `TPL-010`, `PRIV-001`, `REL-004`.

Requirements still `BLOCKED — TARGET`:

`CON-001`, `CON-002`, `CON-004`, `CON-007`, `CON-009`, `FR-005`, `FR-006`, `FR-007`, `FR-009`, `FR-011`, `FR-015`, `HUE-001`, `HUE-002`, `HUE-003`, `HUE-010`, `HUE-011`, `HUE-012`, `HUE-017`, `HUE-018`, `HUE-019`, `TPL-001`, `TPL-004`, `TPL-006`, `TPL-007`, `UX-DEL-003`, `DATA-002`, `DATA-004`, `PRIV-002`, `PRIV-003`, `PRIV-004`, `SEC-004`, `SEC-005`, `REL-008`, `QA-001`, `QA-002`, `UX-VIS-001`, `UX-VIS-002`.

The corresponding acceptance criteria have the same IDs with the `AC-` prefix.

These unresolved checks block a conformant release even after all local failures are repaired. They must not be relabeled Pass based on emulator screenshots, unit tests, shared-suite success, or source inspection alone.

## Closure rule

For each local failure:

1. implement the requirement through the SRS-selected SAD mechanism;
2. add focused tests matching the authoritative acceptance criterion;
3. update the owning phase evidence with exact commands/results;
4. change the final matrix only after local proof exists;
5. execute target acceptance separately where required.
