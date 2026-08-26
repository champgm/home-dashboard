# Home Dashboard 2.2.0 Nonconformance Rectification Plan

Status: **LOCAL RECTIFICATION IMPLEMENTED — EVIDENCE RECONCILED; TARGET AND MODEL ACCEPTANCE PENDING**

Plan date: 2026-08-25

Authority: `docs/SRS_2.2.0.yaml`, `docs/SAD_2.2.0.yaml`, and `docs/nonconformance/README.md`

## Purpose and authority

This plan turns every item in the canonical nonconformance register into sequenced implementation, verification, and acceptance work. It does not revise the SRS or SAD. If implementation convenience conflicts with either authority, stop the affected phase and resolve the contradiction explicitly rather than weakening an acceptance criterion.

Evidence produced while executing this plan belongs under `implementation_evidence/nonconformance_rectification_plan/`, with one record named `phase-XX.md` for each phase. Use [the handoff template](./99_PHASE_HANDOFF_TEMPLATE.md) for those records.

## Delivery rules

1. Execute phases in order. A later phase may be prototyped early, but it cannot be closed before its declared dependencies.
2. A nonconformance closes only in its primary ownership phase and only when all listed exit criteria pass. Supporting phases may add evidence but must not claim duplicate ownership.
3. Add focused unit/component/integration tests with each behavior change. Run the common quality gate at every phase exit.
4. Preserve the SAD safety boundary: typed, resource-specific Hue management; no generic raw JSON editor, arbitrary Hue endpoint entry, Hue cloud dependency, or credential exposure.
5. Treat the legacy app screenshots as presentation references, not as authority over the SRS/SAD.
6. Use disposable Hue resources for create/update/delete acceptance tests and record cleanup. Never repurpose a production automation for destructive testing.
7. A target dependency may be marked pending only after all locally executable work and tests pass. Known local failure must remain `FAIL — LOCAL` or `PARTIAL — LOCAL`.

## Phase sequence

| Phase | Outcome | Primary nonconformance closure |
|---|---|---|
| [01](./01_EVIDENCE_BASELINE.md) | Reproducible traceability and evidence baseline | `NC-TRACE-001`, `NC-TRACE-002` |
| [02](./02_HUE_RESOURCE_CATALOG.md) | Shared typed Hue resource catalog and safe mutation boundary | `NC-HUE-001`, `NC-HUE-008` |
| [03](./03_LIGHTS_AND_GROUPS.md) | Complete light and group management | `NC-HUE-002`, `NC-HUE-003` |
| [04](./04_SCENES.md) | Complete scene management | `NC-HUE-004` |
| [05](./05_SENSORS_AND_SEARCH.md) | Sensor configuration/creation and correct search lifecycle | `NC-HUE-005`, `NC-HUE-009` |
| [06](./06_RULES_AND_DIMMER_BINDINGS.md) | Structured rule management and dimmer-binding repair | `NC-HUE-006` |
| [07](./07_SCHEDULES.md) | Structured schedule management | `NC-HUE-007` |
| [08](./08_TPLINK_INFORMATION_AND_ENERGY.md) | Complete plug information and energy presentation | `NC-TPL-001`, `NC-TPL-002` |
| [09](./09_AMBIGUOUS_HUE_READBACK.md) | Safe ambiguous-write read-back and reconciliation | `NC-REL-001` |
| [10](./10_LOCAL_CONFORMANCE_AND_EVIDENCE.md) | Honest, complete local verification and evidence | `NC-EVID-001`, `NC-EVID-002` |
| [11](./11_TARGET_ACCEPTANCE.md) | Device, network, security, and release acceptance | Remaining target-pending acceptance |

The exact requirement and acceptance-criterion allocation is in [the requirement-phase map](./00_REQUIREMENT_PHASE_MAP.md). A mechanical ownership audit is recorded in [98_MECHANICAL_AUDIT.md](./98_MECHANICAL_AUDIT.md).

## Common quality gate

Run these at every phase exit and record exact commands, results, and relevant artifacts:

```text
npm run typecheck
npm run lint
npm run test:ci
npm run check:fixture-secrets
python3 docs/validate_home_dashboard_docs_2.2.0.py
git diff --check
```

If a command is unavailable or renamed, document the replacement and why it is equivalent. A pre-existing failure is not silently waived; identify its owner and keep the phase open unless the authority explicitly permits deferral.

## Definition of complete

The rectification program is complete only when:

- all 16 registered nonconformances have closure evidence and no duplicate primary owner;
- the authoritative 88 requirements and 88 acceptance criteria each appear exactly once in the final traceability matrix;
- no known local failure is labeled target-blocked;
- all phase quality gates and focused tests pass;
- required physical-phone, Hue Bridge/device, TP-Link model, WAN-off, backup/restore, security, and signed-release checks have passed; and
- the canonical nonconformance register and final traceability status reflect the evidence without overstating completion.
