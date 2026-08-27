# Home Dashboard 2.4.1 Baseline Review

## Review status

**APPROVED — implementation baseline**

SRS 2.4.1 and SAD 2.4.1 are a documentation-only patch over the approved 2.4.0 household-oriented dimmer baseline. No functional requirement, acceptance criterion, runtime component, architectural decision, or selected implementation mechanism is changed.

## Defect corrected

`RISK-009` was incorrectly emitted under a separate top-level SAD `risks` section. In 2.4.1 it is located under `accepted_architectural_risks` with `RISK-001` through `RISK-008`. The separate SAD `risks` section is removed.

`RISK-009` remains accepted as written: Configure Dimmer intentionally supports characterized household dimmer forms rather than generalized transactional editing of arbitrary Hue automation graphs. This is consistent with `DG-007` and the operating context of two trusted family members controlling one static home installation.

## Validator strengthening

The 2.4.1 validator now additionally checks that:

- the SAD has no unexpected top-level `risks` collection;
- all accepted architectural risks are under `accepted_architectural_risks`;
- architectural risk IDs are unique and use the `RISK-NNN` form;
- `RISK-009` is present in `accepted_architectural_risks`;
- guardrail and requirement IDs referenced by accepted-risk prose resolve;
- the SAD has no unknown top-level sections relative to the approved 2.4.1 schema.

These validator improvements are document-hygiene checks. They do not change the selected architecture.

## Structural dimmer operations

The 2.4.0/2.4.1 design remains intentionally small. A normal recognized one-binding dimmer edit is one changed-field Rule update and saves directly. Only a UI action that actually creates, deletes, replaces, or changes multiple Hue resources is a `structural_dimmer_edit`. Such an operation uses a lightweight concrete change list, one confirmation, sequential execution, stop-and-refresh on definite or ambiguous failure, and no automatic repair, rollback, transaction journal, or generalized graph transaction system.

This behavior is an implementation-planning concern already covered by `HUE-022`, `ADR-022`, and `DG-007`; no additional requirement or architecture revision is needed.

## Readiness

There are no open SRS or SAD issues introduced by this patch. The 2.4.1 baseline is ready for implementation planning and implementation of the dimmer workflow.
