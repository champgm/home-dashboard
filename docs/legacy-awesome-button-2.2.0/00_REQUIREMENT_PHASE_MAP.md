# Requirement and Phase Ownership Map

This is a focused change-plan ownership index. Requirements not listed here remain owned by the main Home Dashboard implementation plan.

Phase 01 creates the new 2.2.0 authority. The identifiers below are the intended 2.2.0 identifiers and must be confirmed by Phase 01 before later phases proceed.

| Requirement | Primary implementation phase | Notes |
|---|---:|---|
| FR-005 | 06 | Existing horizontally scrollable top navigation must remain intact while dashboard composition changes. |
| FR-011 | 04 | Unknown resources retain the established full-tile translucent question-mark treatment. |
| FR-013 | 05 | Tile integration must preserve editor access without exposing unsupported actions. |
| QA-001 | 06 | Dense dashboard grid must remain usable on Pixel 9 Pro portrait without clipping. |
| QA-003 | 05 | Visual component remains isolated from protocol adapters. |
| UX-VIS-001 | 04 | New 2.2.0 requirement: legacy raised/animated resource-button visual contract. |
| UX-VIS-002 | 06 | New 2.2.0 requirement: legacy dense dashboard grid/composition on supported portrait target. |

## Acceptance ownership

| Acceptance criterion | Primary completion phase | Earlier phase(s) that advance it |
|---|---:|---|
| AC-FR-005 | 07 | 06 |
| AC-FR-011 | 07 | 04, 05 |
| AC-FR-013 | 07 | 05 |
| AC-QA-001 | 07 | 06 |
| AC-QA-003 | 07 | 05 |
| AC-UX-VIS-001 | 07 | 02, 03, 04, 05 |
| AC-UX-VIS-002 | 07 | 06 |

No acceptance criterion in this table may be declared complete before its primary completion phase unless the authoritative SRS 2.2.0 explicitly changes the verification contract.
