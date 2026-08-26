# Phase 09 — Ambiguous Hue Write Read-back

## Objective

Resolve observable ambiguous Hue write outcomes with one safe read-back attempt, without replaying a possibly successful write.

## Ownership

- Primary closure: `NC-REL-001`
- Requirement: `REL-003`
- Dependencies: phases 01–08

## Work

1. Classify every Hue mutation by whether its intended post-write state is observable at a stable read endpoint.
2. On timeout or transport loss after dispatch, never automatically retry the write. For observable updates, perform at most one bounded read-back attempt.
3. Compare normalized observable state with the intended changed-field payload. A match reconciles as successful; a mismatch or failed read remains explicitly ambiguous.
4. Do not read-back/replay non-idempotent create/delete/activation operations unless the SRS/SAD provides a resource-specific safe reconciliation rule.
5. Guard the read-back with lifecycle/cancellation rules so late results cannot update an unmounted screen or superseded operation.
6. Emit privacy-safe diagnostics identifying operation class and outcome without bridge credentials or sensitive payloads.

## Verification

- Deterministic transport tests cover response success, pre-dispatch failure, ambiguous timeout plus matching read-back, nonmatching read-back, failed read-back, and cancellation.
- Tests prove exactly one read-back and zero write retries after an ambiguous dispatch.
- Resource tests cover representative light/group updates and non-observable create/delete paths.
- UI tests distinguish confirmed success, confirmed failure, and unresolved ambiguity.
- Run the common quality gate.

## Exit criteria

- All observable Hue mutation routes use the shared reconciliation policy.
- Unsafe write retry is absent and non-observable operations remain honestly ambiguous.
- `NC-REL-001` is closed with focused evidence.

