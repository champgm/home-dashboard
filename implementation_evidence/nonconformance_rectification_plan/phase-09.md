# Phase 09 — Ambiguous Hue Read-back Handoff

Status: `VERIFIED — LOCAL; TARGET ACCEPTANCE PENDING`

## Scope

Primary closure: `NC-REL-001`.

Requirement: `REL-003`.

## Implemented evidence

- [ApplicationService](../../src/app/ApplicationService.ts) marks observable Light, Group, Sensor, Scene-lightstate, status, and resource updates with intended changed fields.
- On a post-dispatch ambiguous result it performs at most one bounded `getResource` read while foregrounded; it never retries the write. Matching observable fields reconcile into known state, while mismatch/read failure remains Ambiguous.
- Lifecycle generation checks prevent read-back or late writes from updating state after backgrounding or operation abandonment. Create/delete/activation operations remain non-reconciled and are not replayed.
- Diagnostics remain operation/category based and use the existing redaction path.

## Focused verification

- [Ambiguous-write tests](../../test/app/commands/hueAmbiguousReadback.test.ts) cover matching Light read-back, nonmatching Group read-back with exactly one write/one read, foreground abandonment, and changed Sensor config.
- [Hue adapter tests](../../test/protocol/hue/catalog/mutationBoundary.test.ts) cover the observable resource subpaths used by reconciliation.

## Disposition

The local unsafe-retry behavior is verified. Controlled network interruption and user-visible target confirmation remain phase-11 acceptance.
