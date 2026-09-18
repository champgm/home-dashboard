# Phase 17 — Final Traceability and POC Decision

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-01.md` through `implementation_evidence/ecobee-hap-poc/phase-16.md`

**Prerequisites:** Phases 01–16 complete or explicitly failed/blocked.

## Objective

Reconcile every mandatory obligation, acceptance criterion, milestone, target-gated item, security/governance result, and limitation; issue the charter-defined GO, CONDITIONAL GO, or NO-GO decision without implementing missing major work.

## Why this phase exists

Final acceptance must integrate evidence, not become a rescue implementation phase. It ensures a successful demo cannot hide unmet recovery, security, WAN, maintenance, or target requirements.

## Authoritative requirements

- PRIMARY: `OBJ-12`
- Verification: all `OBJ-*`, `SAFE-*`, `PAIR-*`, and `ARC-*`

## Relevant design sections

- charter `Milestone decisions` and `Exit decision`
- design `Production implications if the POC passes`
- complete acceptance/evidence document

## In scope

- Run plan validator, typecheck, complete deterministic suite, and secret scan.
- Reconcile the 42 mandatory plan IDs against primary phase evidence.
- Reconcile HAP-001 through HAP-017 and every capability/resilience/security/WAN/reliability entry.
- Verify M1, M2, M3 outcomes and every pending target item.
- Inspect permissions, native dependencies, network destinations, protected storage, logging, production-app isolation, notices, and documentation.
- Create final traceability status and fill the authoritative decision template.
- For GO, list required future SRS/SAD revision topics without editing production specifications.

## Explicitly out of scope

- Major missing subsystem implementation, weakening criteria, production integration, formal SRS/SAD revision, unsupported feature promises

## Expected repository changes

Existing prerequisites: all phase evidence and completed spike.

Expected outputs:

- `implementation_evidence/ecobee-hap-poc/final-traceability-status.md`
- final decision in `implementation_evidence/ecobee-hap-poc/RESULTS.md`
- Phase 01–16 evidence corrections where reconciliation finds clerical omissions
- `implementation_evidence/ecobee-hap-poc/phase-17.md`

## Required implementation behavior

- Each mandatory ID and HAP criterion has one explicit final status and evidence link.
- `PENDING TARGET`, `BLOCKED`, `FAIL`, and unsupported required capabilities cannot be relabeled PASS.
- GO requires M3 and every required critical criterion/reliability gate to pass.
- CONDITIONAL GO conditions are bounded, owned, dated, and do not conceal a charter NO-GO condition.
- Final artifacts contain no secrets or stable household identifiers.

## Tests

- Full deterministic suite and plan validator.
- Re-run only target checks needed to close an outstanding item; do not duplicate accepted evidence without reason.
- Manual code/config/privacy/permission/dependency/evidence audit.
- Mechanical ID/acceptance/path/version/command/context-size audit.

## Acceptance focus

- Final status for every `HAP-001` through `HAP-017`, capability observation, resilience entry, security check, WAN procedure, reliability gate, and GO checklist item.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
python3 docs/ecobee-hap-poc/implementation_plan/validate_plan.py
npm run check:docs
git diff --check
```

## Persisted implementation evidence

Create `phase-17.md`, `final-traceability-status.md`, and `RESULTS.md`. The traceability file must list all 42 mandatory aliases and all 17 HAP criteria with final status/evidence. `RESULTS.md` must use the decision template from the acceptance document.

## Exit criteria

- [ ] Validator, typecheck, tests, docs checks, and secret audit pass or failures are decision inputs.
- [ ] All 42 mandatory obligations and 17 acceptance criteria have final evidence-backed status.
- [ ] Every target-gated item is closed or explicitly blocks/conditions the decision.
- [ ] M1/M2/M3 and final GO/CONDITIONAL GO/NO-GO follow the charter rules.
- [ ] No major work was implemented in final acceptance.
- [ ] Final artifacts are complete, sanitized, and reviewable.
