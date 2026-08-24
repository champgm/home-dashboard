# Phase 01 — Authoritative 2.2.0 Spec / Design Revision

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `src/tabs/common/Button.tsx`
- `src/tabs/common/Style.ts`
- `screenshot1.png`
- `screenshot2.png`
- `screenshot3.png`

## Objective

Produce approved `docs/SRS_2.2.0.yaml` and `docs/SAD_2.2.0.yaml` that make the requested remediation outcomes authoritative before code changes begin.

## Why this phase exists

Hue `/api/config` provisioning is a straightforward code defect under the existing Hue requirement, but the exact legacy tile appearance and diagnostic de-duplication behavior are new/clarified stakeholder expectations. They must be encoded in the SRS/SAD rather than silently invented by implementation.

## Authoritative requirements

Current inputs: `HUE-002`, `HUE-013`, `REL-006`, `SEC-002`, `FR-006`, `QA-001`, `FR-011`, `UX-DEL-001..003`.

Expected 2.2.0 additions/clarifications: `REL-008`, `UX-VIS-001`, `AC-REL-008`, `AC-UX-VIS-001`, plus clarified `AC-HUE-002` and `AC-QA-001`.

## Relevant SAD sections

- `hue_v1_design.provisioning`
- `logging_and_diagnostics`
- `runtime_components`
- `repository_structure`
- `verification_architecture`
- `architecture_overview`

## In scope

- Version both documents to 2.2.0.
- Add the requirements/acceptance changes in `00_REQUIREMENT_PHASE_MAP.md`.
- Specify Hue create-user as unauthenticated `POST /api`.
- Specify the modern implementation mechanism for safe-area handling using the already-selected React Native stack.
- Specify the modern recreation of legacy resource-tile visual grammar using current components and retained assets; do not select the obsolete old button package.
- Specify diagnostic ownership/keying: one current bridge/snapshot diagnostic, one current diagnostic per plug endpoint, operation-specific provisioning diagnostic, and clear-on-resolution behavior.
- Require bounded, credential-safe technical detail.
- Update traceability and baseline review.

## Explicitly out of scope

- Source-code changes.
- Reopening permanent single-bridge, networking, persistence, Hue scope, or recovery guardrails.
- Pixel/live-Hue execution.

## Expected repository changes

### Existing prerequisites

- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `docs/validate_home_dashboard_docs_2.1.0.py`

### Expected outputs

- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `docs/BASELINE_REVIEW_2.2.0.md`
- `docs/validate_home_dashboard_docs_2.2.0.py`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-01.md`

## Required implementation behavior

This phase is documentation only. If the requested visual contract cannot be expressed objectively enough for acceptance, stop and flag the SRS rather than deferring interpretation to Phase 06/07.

## Tests / checks

```sh
python3 docs/validate_home_dashboard_docs_2.2.0.py
git diff --check
```

Perform an adversarial consistency review specifically for:

- no conflict between dashboard no-delete styling and required deletion capability;
- no credential detail allowed in diagnostics;
- safe-area requirement applies to tab strip but does not double-inset native-stack screens;
- `POST /api` provisioning contract is consistent across SRS and SAD.

## Acceptance focus

This phase defines/revises, but does not execute, `AC-HUE-002`, `AC-QA-001`, `AC-REL-008`, and `AC-UX-VIS-001`.

## Persisted implementation evidence

Create `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-01.md`.

## Exit criteria

- [ ] SRS/SAD 2.2.0 exist with the required revisions.
- [ ] Both are marked `approved-implementation-baseline` only after adversarial review passes.
- [ ] Validator reports zero errors/warnings.
- [ ] New IDs appear in traceability.
- [ ] No source code was changed.
- [ ] Evidence file is complete.
