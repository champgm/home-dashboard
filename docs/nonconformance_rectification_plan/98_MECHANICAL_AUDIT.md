# Mechanical Plan Audit

Run this audit whenever the canonical nonconformance register or this plan changes.

## Required invariants

- The plan contains 11 numbered phases in dependency order.
- All 16 canonical `NC-*` identifiers occur in the primary-ownership table.
- Every canonical identifier has exactly one primary phase.
- No unknown identifier appears as an owned nonconformance.
- Every phase link resolves and every local Markdown fragment targets an existing heading.
- Requirements and acceptance criteria referenced by the plan exist in `docs/SRS_2.2.0.yaml`.
- The documentation validator and `git diff --check` pass.

## Current designed allocation

| Metric | Expected |
|---|---:|
| Numbered phases | 11 |
| Canonical nonconformances | 16 |
| Primary ownership assignments | 16 |
| Duplicate primary owners | 0 |
| Unknown primary IDs | 0 |

This file describes an audit contract, not execution evidence. Record the actual audit command and output in the phase evidence record whenever the invariant is checked.

