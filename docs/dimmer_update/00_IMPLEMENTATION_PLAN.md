# Home Dashboard 2.4.1 — Dimmer/Sensor Implementation Plan

## Authority

- `docs/SRS_2.4.1.yaml` defines **what** must be true.
- `docs/SAD_2.4.1.yaml` defines the selected **how**.
- `docs/BASELINE_REVIEW_2.4.1.md` records the approved documentation patch and implementation readiness.
- This plan defines only order, boundaries, dependencies, deliverables, verification, and handoff.
- If implementation exposes a requirement ambiguity, stop and request an SRS revision.
- If the selected mechanism is contradictory or impractical, stop and request a SAD revision. Do not silently substitute another architecture.

## Plan scope and current repository state

This is a **delta implementation plan** for the 2.4.1 household dimmer/sensor workflow on top of the already implemented Home Dashboard repository. The completed main, configuration-defaults, UI/provisioning-remediation, legacy-button, and nonconformance-rectification plans remain historical implementation evidence. This plan does not reimplement those subsystems.

The requirement map therefore preserves the latest completed historical primary owner for unchanged requirements and assigns the two new/current dimmer requirements (`HUE-021`, `HUE-022`) to this plan. Phase 08 still reruns the complete 2.4.1 acceptance/traceability matrix.

The application is a private household controller for two trusted family members, one permanent Hue bridge, and a static set of local devices. Do not add production-platform machinery such as generalized Hue automation graph transactions, distributed locks, durable operation journals, ownership databases, background repair workers, or automated rollback/reconciliation systems. `DG-007` is binding.

## Repository-root path convention

Every path in these prompts is relative to the repository root. Run commands from the repository root. Do not infer another working directory.

Authoritative inputs expected before Phase 01 begins:

- `docs/SRS_2.4.1.yaml`
- `docs/SAD_2.4.1.yaml`
- `docs/BASELINE_REVIEW_2.4.1.md`
- `docs/validate_home_dashboard_docs_2.4.1.py`
- this `implementation_plan/` directory

The repository already contains the source/test paths called out as prerequisites in each phase. Files explicitly labeled **new output** may be absent until the phase that creates them.

## Phase execution rules

1. Execute phases in numeric order.
2. Read this file, `00_REQUIREMENT_PHASE_MAP.md`, the 2.4.1 SRS/SAD, and the current phase file before changing code.
3. Read only the additional source/SAD sections needed by the phase. Minimize active context.
4. Write focused tests together with the implementation. Do not postpone locally testable correctness to Phase 08.
5. Preserve current protocol/resource behavior unless the phase explicitly requires a change.
6. No phase may invent model/event mappings for the household dimmer. Phases 01–06 use injected synthetic catalogs/fixtures for deterministic tests. Phase 07 adds the production catalog entry only from captured household evidence.
7. No raw Hue JSON write editor, fuzzy name matching, serialized-substring association, automatic repair, automatic retry of ambiguous writes, or generalized transaction engine may be introduced. An explicit catalog-revalidated target replacement for one otherwise recognized missing-target Rule is not automatic repair.
8. A simple recognized one-binding edit must remain the short path: control/gesture → action/target → Save → one ordinary changed-field Rule update → authoritative refresh.
9. Structural behavior is implemented only for an edit that truly requires multiple resource operations or create/delete/replace semantics. It uses the lightweight `DimmerChangeSet`; no durable state is added.

## Testing expectations

At minimum, each phase runs its focused Jest tests and `npm run typecheck`. Any phase touching Hue mutation logic must also run the existing Rule/catalog/action-policy and ambiguous-write regression slices that it depends on. Failures must produce useful credential-safe diagnostics.

Phase 08 runs the complete local suite and target acceptance.

## No-scope-creep rule

Do not redesign the general dashboard, plug subsystem, persistence model, provisioning flow, button library, or network architecture while implementing dimmer editing. Do not turn Configure Dimmer into a generalized Hue automation authoring environment. Individual Rule/Sensor editors remain the escape hatch for custom or unsupported automation.

## Persisted implementation evidence

The repository already has `implementation_evidence/phase-01.md` through `phase-27.md` from the completed main plan. To avoid destroying historical evidence, this delta plan uses:

- `implementation_evidence/dimmer-2.4.1/phase-01.md` … `phase-08.md`
- `implementation_evidence/dimmer-2.4.1/final-traceability-status.md`

Each phase evidence file records work completed, requirements addressed, tests/results, acceptance criteria exercised, materially changed files, known limitations, target-gated checks, deviations/specification problems, and handoff notes.

## Target-gated work

The actual household dimmer characterization and real device/phone checks are target-gated. Local implementation must not be blocked earlier than necessary by target availability. Phases 01–06 use synthetic fixtures/catalog injection. Phase 07 requires the real bridge to add/verify the production catalog entry. Phase 08 closes live behavioral and two-phone checks.

If Phase 07 cannot run because the target is unavailable, record the exact pending checks and stop before claiming `HUE-021`/`HUE-022` complete. Do not invent a production model mapping.

## Discovered specification/design defects

If a phase discovers an SRS ambiguity or SAD contradiction:

1. stop the affected implementation work;
2. document the defect in that phase's evidence;
3. identify the exact requirement/architecture section;
4. do not hide the issue with a local code convention;
5. resume only after the authority documents are revised or the issue is explicitly resolved.

## Completion and handoff

A phase is complete only when implementation, focused tests, typecheck, evidence, and stated exit criteria are complete. Use `99_PHASE_HANDOFF_TEMPLATE.md`. The final phase creates the final traceability status and may not declare the baseline complete while a required target-gated item remains open.
