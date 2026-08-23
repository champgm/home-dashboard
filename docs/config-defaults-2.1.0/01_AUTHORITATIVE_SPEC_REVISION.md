# Phase 01 — Authoritative SRS/SAD Revision for Configuration Defaults

Before implementation, read:

- `docs/config-defaults-2.1.0/00_IMPLEMENTATION_PLAN.md`
- `docs/config-defaults-2.1.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.0.0.yaml`
- `docs/SAD_2.0.0.yaml`
- `docs/validate_home_dashboard_docs_2.0.0.py`

## Objective

Produce an approved, mechanically validated SRS/SAD **2.1.0** that authoritatively defines bundled bridge/plug defaults plus phone-local user overrides/additions/removals before any implementation code changes.

## Why this phase exists

The current 2.0.0 contract says plug preseed applies only when the entire config key is absent and is never merged later. The requested behavior intentionally changes that contract. Implementing it before revising the SRS/SAD would violate the authority rule.

## Authoritative requirements to revise or confirm

- `HUE-001`
- `HUE-012`
- `TPL-002`
- `TPL-009`
- `CON-005`
- `DATA-001`
- `DATA-002`
- `DATA-003`
- `DATA-005`
- supporting invariants: `SEC-001`, `TPL-010`, `CON-010`, `PRIV-001`, `PRIV-002`, `PRIV-004`

## Relevant SAD sections

- `persistence_architecture`
- `preseed_architecture`
- `internal_domain_interfaces.types.AppConfig`
- `internal_domain_interfaces.services.ConfigStore`
- `repository_structure`
- `decision_guardrails`

## In scope

Revise the authoritative documents so that they explicitly define:

1. bundled default Hue bridge IPv4 support;
2. bundled plug endpoint defaults with immutable stable IDs;
3. phone-local explicit user overrides;
4. user-added plug endpoints;
5. explicit removal/tombstone semantics for bundled plug endpoints;
6. update behavior in which new/changed bundled defaults apply only where the phone has no explicit conflicting choice;
7. Reset Local Configuration returning the non-secret effective configuration to the **current installed build's defaults**;
8. corruption/I/O failure remaining fail-closed and never triggering default resolution as though the overlay were empty;
9. HueBinding remaining protected and unaffected by reset/defaults;
10. no synchronization between the two phones.

Revise acceptance criteria, traceability, risks, and SAD persistence/preseed mechanisms accordingly. Run a fresh adversarial review before approving 2.1.0.

## Explicitly out of scope

- source-code changes outside `docs/`;
- Hue/TP-Link protocol changes;
- bridge switching/replacement;
- arbitrary dynamic configuration keys;
- cloud/default retrieval.

## Expected repository changes

### Existing prerequisites

- `docs/SRS_2.0.0.yaml`
- `docs/SAD_2.0.0.yaml`
- `docs/validate_home_dashboard_docs_2.0.0.py`

### Expected outputs

- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `docs/validate_home_dashboard_docs_2.1.0.py`
- `docs/BASELINE_REVIEW_2.1.0.md`
- `implementation_evidence/config-defaults-2.1.0/phase-01.md`

## Required specification behavior

The SRS should own observable precedence/update outcomes without unnecessarily mandating the overlay data structure. The SAD should own the selected overlay/tombstone/migration mechanism.

Do not weaken the existing rule that corrupt or unreadable stored state is preserved until explicit Reset Local Configuration.

The SRS/SAD must distinguish:

- a value never overridden by the user;
- a user override;
- a bundled plug explicitly removed by the user;
- a user-added plug.

## Tests / review

- Run the updated mechanical validator.
- Adversarially review: update A→B, removed seed, edited seed, user-added plug, bridge override, corrupt storage, read failure, reset, two-phone independence, protected HueBinding survival.
- Verify no 2.1 requirement implies synchronization or bridge switching.

## Acceptance focus

This phase changes the authoritative wording underlying `AC-HUE-001`, `AC-TPL-009`, `AC-DATA-001`, `AC-DATA-002`, `AC-DATA-003`, `AC-DATA-005`, and the reset portion of `AC-HUE-017`.

## Commands / checks

```sh
python docs/validate_home_dashboard_docs_2.1.0.py
git diff --check
```

Do not proceed to Phase 02 unless 2.1.0 is `approved-implementation-baseline`.


## Persisted implementation evidence

Create or update `implementation_evidence/config-defaults-2.1.0/phase-01.md` using `docs/config-defaults-2.1.0/99_PHASE_HANDOFF_TEMPLATE.md`.

Record exact commands/results, requirement IDs addressed, acceptance criteria exercised, materially changed files, known limitations, target-gated work, and any SRS/SAD defect. Important state must not exist only in chat output.

## Exit criteria

- [ ] Every in-scope item exists.
- [ ] All required non-target-gated tests/checks pass.
- [ ] Evidence file for this phase is complete.
- [ ] No SRS/SAD issue is silently deferred.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
