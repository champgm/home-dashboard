# Home Dashboard 2.2.0 Nonconformance Register

Status: **LOCAL CODE RECTIFICATION RECONCILED — PHASE 08 MODEL VERIFICATION OPEN — TARGET ACCEPTANCE PENDING**  
Audit date: 2026-08-25  
Authority: `docs/SRS_2.2.0.yaml` and `docs/SAD_2.2.0.yaml`

## Purpose

This directory is the canonical record of confirmed implementation nonconformance and unresolved acceptance evidence. A green typecheck or shared test suite does not close a requirement unless the required behavior is implemented and the authoritative acceptance criterion has been exercised.

The audit is source-based. It distinguishes:

- **FAIL — LOCAL:** source or tests prove required behavior is absent or contradicts the SRS/SAD;
- **PARTIAL — LOCAL:** part of the requirement exists, but required behavior remains absent;
- **PENDING TARGET:** the implementation may exist, but required phone/device/release evidence has not been produced.

`PENDING TARGET` is a release-acceptance nonconformance, not proof of an implementation defect. Accepted SRS risks and explicit non-goals are not listed as defects.

## Confirmed local nonconformance

The table below records the 2026-08-25 pre-rectification findings and remains the canonical audit index. All 16 IDs have one primary rectification phase; current local status, source/test artifacts, and target-pending status are governed by the [machine-readable evidence manifest](../../implementation_evidence/nonconformance_rectification_plan/evidence-manifest.yaml) and [rectification ledger](../../implementation_evidence/nonconformance_rectification_plan/final-traceability-status.md). The detailed finding text is retained for auditability.

| ID | Severity | Requirements/decisions | Summary | Detail |
|---|---|---|---|---|
| `NC-HUE-001` | High | `FR-013`, SAD full-management strategy | Required cross-resource Hue V1 writable/read-only field catalog is absent/incomplete and editors do not use one. | [Hue management](./hue-resource-management.md#nc-hue-001--the-required-hue-v1-resource-catalogeditor-contract-is-not-implemented) |
| `NC-HUE-002` | High | `HUE-004`, `FR-013` | Light editor exposes only Name and binary On/Off, omitting supported V1 state/metadata management. | [Hue management](./hue-resource-management.md#nc-hue-002--light-management-is-incomplete) |
| `NC-HUE-003` | High | `HUE-005`, `FR-013` | Group editor/create flow omits membership, class, and supported actions. | [Hue management](./hue-resource-management.md#nc-hue-003--group-management-is-incomplete) |
| `NC-HUE-004` | High | `HUE-006`, `FR-013` | Scene editor/create flow omits GroupScene/LightScene forms and per-light state editing. | [Hue management](./hue-resource-management.md#nc-hue-004--scene-management-is-incomplete) |
| `NC-HUE-005` | High | `HUE-007`, `FR-013` | Sensor inspection, configuration, creation forms, validation, and configuration routing are incomplete. | [Sensor/dimmer](./sensor-and-dimmer.md) |
| `NC-HUE-006` | High | `HUE-008`, `FR-013` | Rule editor/create flow has no condition/action controls, preventing dimmer binding inspection or repair. | [Hue management](./hue-resource-management.md#nc-hue-006--rule-management-is-incomplete) |
| `NC-HUE-007` | High | `HUE-009`, `FR-013` | Schedule editor/create flow has no time-pattern or command controls. | [Hue management](./hue-resource-management.md#nc-hue-007--schedule-management-is-incomplete) |
| `NC-HUE-008` | Medium | `HUE-020`, SAD partial updates | Resource Link saves resend every field; generic adapter mutations bypass changed-field serializers. | [Hue management](./hue-resource-management.md#nc-hue-008--changed-field-only-update-enforcement-is-incomplete) |
| `NC-HUE-009` | Medium | `HUE-015` | Search result feedback and foreground active-search polling are missing. | [Sensor/dimmer](./sensor-and-dimmer.md#nc-hue-009--search-status-lifecycle-and-feedback-are-incomplete) |
| `NC-TPL-001` | High | `TPL-005` | Plug model, identifiers, MAC, signal, relay and feature details are parsed but not displayed. | [TP-Link](./tplink.md#nc-tpl-001--required-plug-information-is-not-displayed) |
| `NC-TPL-002` | High | `TPL-008` | Energy capability exists in the adapter but is never requested or displayed by the application service/UI. | [TP-Link](./tplink.md#nc-tpl-002--energy-information-is-not-integrated) |
| `NC-REL-001` | High | `REL-003` | Ambiguous Hue writes return immediately without the required observable-state read-back attempt. | [Runtime](./runtime-and-failure-semantics.md#nc-rel-001--ambiguous-hue-writes-do-not-attempt-read-back) |
| `NC-TRACE-001` | High | SRS traceability/baseline | Main traceability omitted `REL-008`, `UX-VIS-001`, `UX-VIS-002` and their acceptance criteria. | [Evidence](./evidence-and-acceptance.md#nc-trace-001--the-main-traceability-matrix-was-incomplete) |
| `NC-TRACE-002` | Medium | Evidence integrity | Main traceability contained 146 broken relative evidence links. Corrected during this audit. | [Evidence](./evidence-and-acceptance.md#nc-trace-002--main-traceability-evidence-links-were-broken) |
| `NC-EVID-001` | High | Phase exit criteria | Multiple phase records declared completion while their owned local behavior/tests were absent. | [Evidence](./evidence-and-acceptance.md#nc-evid-001--phase-completion-was-overstated) |
| `NC-EVID-002` | Medium | Acceptance criteria | Target-blocked labels masked known local failures for Hue editors, TP-Link presentation, and Hue ambiguous read-back. | [Evidence](./evidence-and-acceptance.md#nc-evid-002--target-blocked-status-masked-local-failures) |

## Release disposition

The locally identified code failures have focused implementation/evidence entries, but Phase 08 remains open for representative TP-Link model verification and the release still cannot be declared SRS/SAD conformant until the target-dependent items in [unresolved target acceptance](./evidence-and-acceptance.md#unresolved-target-and-additional-acceptance) are executed.

## Audit boundary

This register records every confirmed nonconformance found by the 2026-08-25 repository-wide source/evidence audit, including documentation defects corrected by the audit. The rectification ledger records local closure without claiming physical-device acceptance. Requirements not listed as a local failure are not automatically proven conformant; their current verification disposition remains in `implementation_evidence/final-traceability-status.md`.
