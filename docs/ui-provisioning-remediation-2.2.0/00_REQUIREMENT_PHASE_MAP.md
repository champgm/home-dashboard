# Requirement / Phase Map — UI and Hue Provisioning Remediation 2.2.0

This is a **change-impact ownership map**, not a replacement for the complete SRS traceability matrix.

Phase 01 must create the expected 2.2.0 requirement/acceptance changes listed below. Phases 02–08 may not begin until those IDs and revisions exist in the approved 2.2.0 SRS/SAD.

## Primary change ownership

| Requirement | Primary phase | Change reason |
|---|---:|---|
| `HUE-002` | 02 | Fix actual Hue V1 create-user request and prove `/api` root operation |
| `HUE-013` | 02 | Correct success/error handling at the real provisioning transport boundary |
| `REL-006` | 03 | Preserve category and safe detail through provisioning service/UI |
| `SEC-002` | 03 | Provisioning/diagnostics must never expose Hue authorization material |
| `REL-008` **NEW in 2.2.0** | 04 | One current Hue-root diagnostic, one current diagnostic per plug, clear on resolution, bounded useful detail |
| `FR-006` | 04 | Advanced/Bridge remains the technical diagnostic surface |
| `QA-001` **clarified in 2.2.0** | 05 | Required controls/top tabs must not be obscured by Android status bar/insets |
| `UX-VIS-001` **NEW in 2.2.0** | 07 | Established legacy dashboard tile visual/interaction grammar |
| `FR-011` | 06 | Full-tile translucent question-mark treatment must use the established visual form |
| `UX-DEL-001` | 07 | Delete relocated from dashboard tile must still require confirmation |
| `UX-DEL-002` | 07 | Opening editor delete confirmation must not issue DELETE |
| `UX-DEL-003` | 07 | Confirm remains spatially separated and modal |

## Supporting requirements by phase

- Phase 02: `HUE-012`, `REL-001`, `REL-002`, `QA-003`
- Phase 03: `REL-001`, `HUE-017`, `PRIV-002`, `QA-003`
- Phase 04: `FR-001`, `FR-002`, `PRIV-001`, `PRIV-002`
- Phase 05: `FR-005`, `FR-001`
- Phase 06: `FR-007`, `FR-008`, `FR-009`, `FR-010`, `FR-016`
- Phase 07: `FR-013`, `FR-014`, `FR-015`
- Phase 08: all requirements above as final integration verification

## Acceptance coverage

| Acceptance criterion | Phases |
|---|---|
| `AC-HUE-002` | 02 local protocol slice; 08 live completion |
| `AC-HUE-013` | 02 |
| `AC-REL-006` | 03, 08 |
| `AC-SEC-002` | 03, 04, 08 |
| `AC-REL-008` **NEW in 2.2.0** | 04, 08 |
| `AC-FR-006` | 04, 08 |
| `AC-QA-001` | 05 local/inset test; 08 Pixel completion |
| `AC-FR-011` | 06, 08 |
| `AC-UX-VIS-001` **NEW in 2.2.0** | 06 partial; 07 complete; 08 visual target verification |
| `AC-UX-DEL-001` | 07 |
| `AC-UX-DEL-002` | 07 |
| `AC-UX-DEL-003` | 07 |

## Phase 01 required authoritative changes

Phase 01 must, at minimum:

1. Add `UX-VIS-001` with an objectively testable legacy tile contract. It should require:
   - square compact primary tiles following the established legacy dashboard proportions;
   - a visibly raised/dimensional main control;
   - overlapping Favorite control at lower-left and Edit control at lower-right where applicable;
   - icon-based Favorite/Edit affordances matching the established assets, not Unicode glyph substitutions;
   - established Solarized-derived state colors, including yellow On, neutral/dark Off, orange indeterminate Group state, and consistent known non-binary treatment;
   - full-tile translucent question-mark image for Unknown/Missing;
   - no destructive Delete affordance embedded in the normal dashboard tile; deletion is performed from the editor/administration flow and remains subject to `UX-DEL-001..003`.
2. Add `AC-UX-VIS-001` covering component structure plus visual verification against the retained legacy references on supported Pixel dimensions.
3. Clarify `QA-001` / `AC-QA-001` so Android status bar/system insets cannot cover the top tab strip or required controls.
4. Add `REL-008` / `AC-REL-008` for bounded current diagnostics and de-duplication/clear-on-success behavior.
5. Extend `external_interface_contracts.hue_v1` so unauthenticated link-button create-user is explicitly `POST /api` with JSON `devicetype`, not `/api/config`.
6. Tighten `AC-HUE-002` to test both link-button-not-pressed Hue rejection and successful link-button provisioning at the correct API root.
7. Update the SAD with the selected safe-area, tile, diagnostic-keying, and provisioning-route mechanisms without reintroducing obsolete runtime dependencies.
