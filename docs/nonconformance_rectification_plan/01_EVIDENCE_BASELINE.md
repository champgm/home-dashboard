# Phase 01 — Evidence Baseline

## Objective

Make traceability and evidence checks reproducible before implementation claims change.

## Ownership

- Primary closure: `NC-TRACE-001`, `NC-TRACE-002`
- Authority: SRS traceability baseline and evidence integrity
- Dependencies: none

## Work

1. Add a repeatable repository check that parses the SRS and proves all 88 requirements and 88 acceptance criteria occur exactly once in the final matrix.
2. Validate local evidence file paths and Markdown fragments; report missing files, headings, duplicate IDs, and unknown IDs as failures.
3. Add a closure ledger keyed by canonical `NC-*` ID, with one primary phase and links to objective evidence.
4. Integrate these checks into the normal documentation/CI validation path.
5. Preserve the distinction between implementation failure, partial implementation, and target-pending acceptance.

## Verification

- Focused tests intentionally introduce a missing ID, duplicate ID, unknown ID, broken path, and broken fragment and prove each fails.
- The unmodified repository passes the new traceability/link check and the common quality gate.
- The ownership audit finds 16 canonical IDs, 16 assignments, and no duplicates or unknowns.

## Exit criteria

- The 88/88 baseline is machine-verified.
- Every final-matrix evidence link resolves.
- `NC-TRACE-001` and `NC-TRACE-002` have closure evidence; implementation or target gaps elsewhere remain open.

