# Phase 08 — Final Acceptance and Traceability Closure

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`

## Objective

Integrate and verify the complete 2.4.1 baseline on the real household installation, with special emphasis on actual dimmer editing, structural failure behavior, Sensor usability, two-phone portrait operation, and preservation of all previously implemented requirements. Produce final requirement/acceptance status evidence.

## Why this phase exists

The final phase must verify rather than invent major missing implementation. It closes target-gated checks, reruns all acceptance criteria, and proves the dimmer change did not regress the existing household controller.

## Authoritative requirements

- `CON-001`
- `CON-002`
- `CON-003`
- `CON-004`
- `CON-005`
- `CON-006`
- `CON-007`
- `CON-008`
- `CON-009`
- `CON-010`
- `FR-001`
- `FR-002`
- `FR-003`
- `FR-004`
- `FR-005`
- `FR-006`
- `FR-007`
- `FR-008`
- `FR-009`
- `FR-010`
- `FR-011`
- `FR-012`
- `FR-013`
- `FR-014`
- `FR-015`
- `FR-016`
- `HUE-001`
- `HUE-002`
- `HUE-003`
- `HUE-004`
- `HUE-005`
- `HUE-006`
- `HUE-007`
- `HUE-008`
- `HUE-009`
- `HUE-010`
- `HUE-011`
- `HUE-012`
- `HUE-013`
- `HUE-014`
- `HUE-015`
- `HUE-016`
- `HUE-017`
- `HUE-018`
- `HUE-019`
- `HUE-020`
- `HUE-021`
- `HUE-022`
- `TPL-001`
- `TPL-002`
- `TPL-003`
- `TPL-004`
- `TPL-005`
- `TPL-006`
- `TPL-007`
- `TPL-008`
- `TPL-009`
- `TPL-010`
- `TPL-011`
- `UX-DEL-001`
- `UX-DEL-002`
- `UX-DEL-003`
- `DATA-001`
- `DATA-002`
- `DATA-003`
- `DATA-004`
- `DATA-005`
- `PRIV-001`
- `PRIV-002`
- `PRIV-003`
- `PRIV-004`
- `SEC-001`
- `SEC-002`
- `SEC-003`
- `SEC-004`
- `SEC-005`
- `SEC-006`
- `REL-001`
- `REL-002`
- `REL-003`
- `REL-004`
- `REL-005`
- `REL-006`
- `REL-007`
- `REL-008`
- `QA-001`
- `QA-002`
- `QA-003`
- `UX-VIS-001`
- `UX-VIS-002`

## Relevant SAD sections

- `verification_architecture`
- `adversarial_review_checklist`
- `baseline_readiness`
- `hue_v1_design.dimmer_management`
- `security_architecture`
- `logging_and_diagnostics`
- `shutdown_and_backgrounding`

## In scope

- Run the complete local test/typecheck/doc/fixture-secret gates.
- Use `00_REQUIREMENT_PHASE_MAP.md` to confirm all 90 mandatory requirements still have exactly one primary implementation owner.
- Execute/reconcile the entire SRS 2.4.1 traceability matrix and record pass/fail/blocked evidence for every requirement and acceptance criterion.
- On the actual household dimmer, verify Configure Dimmer default/Advanced views and perform at least one safe simple recognized binding edit; physically exercise the changed control, verify authoritative refresh, then restore the household mapping through the app and verify it.
- Exercise the structural multi-resource path with the approved synthetic/disposable fixture and, if a safe live structural form exists, optionally verify it live. A live destructive structural change is not required unless the SRS AC specifically demands it.
- Run the supported Pixel 9 Pro portrait checks on both phones, including navigation to Configure Dimmer/SensorEditor and reachable controls.
- Inspect privacy/security/diagnostics: no credential in UI/log/fixture, no cloud/analytics/sync added, no backup regression, no new dangerous permissions.
- Close every target-gated item or mark the baseline blocked; no silent waiver.

## Explicitly out of scope

- No new major subsystem implementation. Any substantial missing mechanism discovered here returns to the owning earlier phase.
- No generalized transaction/repair/rollback system.
- No expansion to unsupported Hue dimmer models without new characterization evidence/authority.

## Expected repository changes

### Existing prerequisite files

- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `test/fixtures/characterization/hue.household-dimmer.json`
- `implementation_evidence/dimmer-2.4.1/phase-01.md`
- `implementation_evidence/dimmer-2.4.1/phase-07.md`
- `scripts/build-local-apk.mjs`

### Expected new/modified outputs

#### Existing files expected to modify

- None expected; this phase should primarily verify/integrate.

#### New files expected to create

- `implementation_evidence/dimmer-2.4.1/phase-08.md`
- `implementation_evidence/dimmer-2.4.1/final-traceability-status.md`

## Required implementation behavior

- No mandatory requirement/AC may be called passed solely because an earlier phase said so; reconcile against current code and evidence.
- The live simple-edit test must use the app UI and real bridge, not only an adapter mock.
- Preserve household state: record the original tested Rule/binding before the live simple edit and restore it explicitly through the app after verification. This is test procedure, not an automatic rollback subsystem.
- If the app backgrounds during a live operation, accept abandonment and refresh on foreground per the existing baseline; do not add background recovery.
- Two-phone concurrent edits remain last-write-wins/refresh; no distributed locking is expected.

## Tests

- Run the full 2.4.1 validator and complete Jest/typecheck suites.
- Run fixture secret scan and inspect development logs/diagnostics for credential leakage.
- Perform live dimmer simple-edit/physical-button/restore sequence and document before/after Rule IDs/targets without secret data.
- Perform two-phone portrait navigation/usability checks and WAN-disabled local-control regression required by the SRS.
- Reconcile every acceptance criterion listed below into final traceability evidence.

## Acceptance focus

The final phase explicitly covers the complete SRS acceptance set:

- **constraints**: `AC-CON-001`, `AC-CON-002`, `AC-CON-003`, `AC-CON-004`, `AC-CON-005`, `AC-CON-006`, `AC-CON-007`, `AC-CON-008`, `AC-CON-009`, `AC-CON-010`
- **functional**: `AC-FR-001`, `AC-FR-002`, `AC-FR-003`, `AC-FR-004`, `AC-FR-005`, `AC-FR-006`, `AC-FR-007`, `AC-FR-008`, `AC-FR-009`, `AC-FR-010`, `AC-FR-011`, `AC-FR-012`, `AC-FR-013`, `AC-FR-014`, `AC-FR-015`, `AC-FR-016`
- **hue**: `AC-HUE-001`, `AC-HUE-002`, `AC-HUE-003`, `AC-HUE-004`, `AC-HUE-005`, `AC-HUE-006`, `AC-HUE-007`, `AC-HUE-008`, `AC-HUE-009`, `AC-HUE-010`, `AC-HUE-011`, `AC-HUE-012`, `AC-HUE-013`, `AC-HUE-014`, `AC-HUE-015`, `AC-HUE-016`, `AC-HUE-017`, `AC-HUE-018`, `AC-HUE-019`, `AC-HUE-020`, `AC-HUE-021`, `AC-HUE-022`
- **tplink**: `AC-TPL-001`, `AC-TPL-002`, `AC-TPL-003`, `AC-TPL-004`, `AC-TPL-005`, `AC-TPL-006`, `AC-TPL-007`, `AC-TPL-008`, `AC-TPL-009`, `AC-TPL-010`, `AC-TPL-011`
- **destructive_actions**: `AC-UX-DEL-001`, `AC-UX-DEL-002`, `AC-UX-DEL-003`
- **data_and_persistence**: `AC-DATA-001`, `AC-DATA-002`, `AC-DATA-003`, `AC-DATA-004`, `AC-DATA-005`
- **privacy**: `AC-PRIV-001`, `AC-PRIV-002`, `AC-PRIV-003`, `AC-PRIV-004`
- **security**: `AC-SEC-001`, `AC-SEC-002`, `AC-SEC-003`, `AC-SEC-004`, `AC-SEC-005`, `AC-SEC-006`
- **runtime_and_failure_semantics**: `AC-REL-001`, `AC-REL-002`, `AC-REL-003`, `AC-REL-004`, `AC-REL-005`, `AC-REL-006`, `AC-REL-007`, `AC-REL-008`
- **quality_attributes**: `AC-QA-001`, `AC-QA-002`, `AC-QA-003`, `AC-UX-VIS-001`, `AC-UX-VIS-002`

- `AC-CON-001`
- `AC-CON-002`
- `AC-CON-003`
- `AC-CON-004`
- `AC-CON-005`
- `AC-CON-006`
- `AC-CON-007`
- `AC-CON-008`
- `AC-CON-009`
- `AC-CON-010`
- `AC-FR-001`
- `AC-FR-002`
- `AC-FR-003`
- `AC-FR-004`
- `AC-FR-005`
- `AC-FR-006`
- `AC-FR-007`
- `AC-FR-008`
- `AC-FR-009`
- `AC-FR-010`
- `AC-FR-011`
- `AC-FR-012`
- `AC-FR-013`
- `AC-FR-014`
- `AC-FR-015`
- `AC-FR-016`
- `AC-HUE-001`
- `AC-HUE-002`
- `AC-HUE-003`
- `AC-HUE-004`
- `AC-HUE-005`
- `AC-HUE-006`
- `AC-HUE-007`
- `AC-HUE-008`
- `AC-HUE-009`
- `AC-HUE-010`
- `AC-HUE-011`
- `AC-HUE-012`
- `AC-HUE-013`
- `AC-HUE-014`
- `AC-HUE-015`
- `AC-HUE-016`
- `AC-HUE-017`
- `AC-HUE-018`
- `AC-HUE-019`
- `AC-HUE-020`
- `AC-HUE-021`
- `AC-HUE-022`
- `AC-TPL-001`
- `AC-TPL-002`
- `AC-TPL-003`
- `AC-TPL-004`
- `AC-TPL-005`
- `AC-TPL-006`
- `AC-TPL-007`
- `AC-TPL-008`
- `AC-TPL-009`
- `AC-TPL-010`
- `AC-TPL-011`
- `AC-UX-DEL-001`
- `AC-UX-DEL-002`
- `AC-UX-DEL-003`
- `AC-DATA-001`
- `AC-DATA-002`
- `AC-DATA-003`
- `AC-DATA-004`
- `AC-DATA-005`
- `AC-PRIV-001`
- `AC-PRIV-002`
- `AC-PRIV-003`
- `AC-PRIV-004`
- `AC-SEC-001`
- `AC-SEC-002`
- `AC-SEC-003`
- `AC-SEC-004`
- `AC-SEC-005`
- `AC-SEC-006`
- `AC-REL-001`
- `AC-REL-002`
- `AC-REL-003`
- `AC-REL-004`
- `AC-REL-005`
- `AC-REL-006`
- `AC-REL-007`
- `AC-REL-008`
- `AC-QA-001`
- `AC-QA-002`
- `AC-QA-003`
- `AC-UX-VIS-001`
- `AC-UX-VIS-002`

## Commands/checks

Run from repository root after the phase changes are present:

```bash
python3 docs/validate_home_dashboard_docs_2.4.1.py docs
npm run typecheck
npm run test:ci
npm run check:fixture-secrets
npm run doctor
npm run build:apk
```

## Persisted implementation evidence

Create/update `implementation_evidence/dimmer-2.4.1/phase-08.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`. Do not leave material implementation state only in chat output.

## Exit criteria

- [ ] All 90 mandatory requirements have an evidence-backed final status.
- [ ] All 90 acceptance criteria have an evidence-backed final status.
- [ ] Actual household dimmer simple edit works, is physically verified, and the original mapping is restored through the app.
- [ ] Both supported phones pass required portrait/navigation checks.
- [ ] Privacy/security/diagnostic inspection passes.
- [ ] All target-gated items are closed or the release is explicitly blocked.
- [ ] `implementation_evidence/dimmer-2.4.1/final-traceability-status.md` is complete.
