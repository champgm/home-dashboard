# Final Traceability Status

- Revision under review: working tree at implementation time (no commit was created by this task).
- Date: 2026-08-25.
- Local automated baseline: `npm run typecheck`, `npm run lint`, `npm run test:ci` (41 suites / 187 tests), the focused rectification regression suite (3 suites / 30 tests), `npm run check:fixture-secrets`, `npm run check:docs`, `npm run doctor`, and `git diff --check` passed. Android target packaging remains phase-11 evidence.
- `BLOCKED — TARGET` means the implementation exists but the required Pixel/Hue/TP-Link/EAS/WAN/APK proof was unavailable. `BLOCKED — FIXTURE ARTIFACT` records the missing `home-dashboard-characterization-evidence-1.1.0.tar.gz`; no live data was invented.
- A 2026-08-25 repository-wide audit found local failures previously masked by green shared tests or target-blocked labels. The [machine-readable evidence manifest](nonconformance_rectification_plan/evidence-manifest.yaml) now indexes focused source/test evidence per nonconformance; Phase 08 model verification and target acceptance remain open. The canonical register is [docs/nonconformance](../docs/nonconformance/README.md).

## Mandatory requirements

| Requirement | Status | Primary evidence |
|---|---|---|
| `CON-001` | BLOCKED — TARGET | [implementation_evidence/phase-01.md](phase-01.md) |
| `CON-002` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) |
| `CON-003` | PASS — LOCAL | [implementation_evidence/phase-01.md](phase-01.md) |
| `CON-004` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) |
| `CON-005` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) |
| `CON-006` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-16.md](phase-16.md) |
| `CON-007` | BLOCKED — TARGET | [implementation_evidence/phase-27.md](phase-27.md) |
| `CON-008` | PASS — LOCAL | [implementation_evidence/phase-26.md](phase-26.md) |
| `CON-009` | BLOCKED — TARGET | [implementation_evidence/phase-13.md](phase-13.md) |
| `CON-010` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) |
| `FR-001` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-16.md](phase-16.md) |
| `FR-002` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `FR-003` | PASS — LOCAL | [implementation_evidence/phase-16.md](phase-16.md) |
| `FR-004` | PASS — LOCAL | [implementation_evidence/phase-16.md](phase-16.md) |
| `FR-005` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) |
| `FR-006` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) |
| `FR-007` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) |
| `FR-008` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `FR-009` | BLOCKED — TARGET | [implementation_evidence/phase-20.md](phase-20.md) |
| `FR-010` | PASS — LOCAL | [implementation_evidence/phase-17.md](phase-17.md) |
| `FR-011` | BLOCKED — TARGET | [implementation_evidence/phase-15.md](phase-15.md) |
| `FR-012` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `FR-013` | PASS — LOCAL | [rectification phase 02](nonconformance_rectification_plan/phase-02.md) |
| `FR-014` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-18.md](phase-18.md) |
| `FR-015` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) |
| `FR-016` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `HUE-001` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) |
| `HUE-002` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) |
| `HUE-003` | BLOCKED — TARGET | [implementation_evidence/phase-05.md](phase-05.md) |
| `HUE-004` | PASS — LOCAL | [rectification phase 03](nonconformance_rectification_plan/phase-03.md) |
| `HUE-005` | PASS — LOCAL | [rectification phase 03](nonconformance_rectification_plan/phase-03.md) |
| `HUE-006` | PASS — LOCAL | [rectification phase 04](nonconformance_rectification_plan/phase-04.md) |
| `HUE-007` | PASS — LOCAL | [rectification phase 05](nonconformance_rectification_plan/phase-05.md) |
| `HUE-008` | PASS — LOCAL | [rectification phase 06](nonconformance_rectification_plan/phase-06.md) |
| `HUE-009` | PASS — LOCAL | [rectification phase 07](nonconformance_rectification_plan/phase-07.md) |
| `HUE-010` | BLOCKED — TARGET | [implementation_evidence/phase-12.md](phase-12.md) |
| `HUE-011` | BLOCKED — TARGET | [implementation_evidence/phase-12.md](phase-12.md) |
| `HUE-012` | BLOCKED — TARGET | [implementation_evidence/phase-04.md](phase-04.md) |
| `HUE-013` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) |
| `HUE-014` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) |
| `HUE-015` | PASS — LOCAL | [rectification phase 05](nonconformance_rectification_plan/phase-05.md) |
| `HUE-016` | PASS — LOCAL | [implementation_evidence/phase-11.md](phase-11.md) |
| `HUE-017` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) |
| `HUE-018` | BLOCKED — TARGET | [implementation_evidence/phase-24.md](phase-24.md) |
| `HUE-019` | BLOCKED — TARGET | [implementation_evidence/phase-24.md](phase-24.md) |
| `HUE-020` | PASS — LOCAL | [rectification phase 02](nonconformance_rectification_plan/phase-02.md) |
| `TPL-001` | BLOCKED — TARGET | [implementation_evidence/phase-13.md](phase-13.md) |
| `TPL-002` | PASS — LOCAL | [implementation_evidence/phase-25.md](phase-25.md) |
| `TPL-003` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) |
| `TPL-004` | BLOCKED — TARGET | [implementation_evidence/phase-13.md](phase-13.md) |
| `TPL-005` | VERIFIED — LOCAL; TARGET MODEL PENDING | [rectification phase 08](nonconformance_rectification_plan/phase-08.md) |
| `TPL-006` | BLOCKED — TARGET | [implementation_evidence/phase-14.md](phase-14.md) |
| `TPL-007` | BLOCKED — TARGET | [implementation_evidence/phase-25.md](phase-25.md) |
| `TPL-008` | VERIFIED — LOCAL; TARGET MODEL PENDING | [rectification phase 08](nonconformance_rectification_plan/phase-08.md) |
| `TPL-009` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-25.md](phase-25.md) |
| `TPL-010` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-25.md](phase-25.md) |
| `TPL-011` | PASS — LOCAL | [implementation_evidence/phase-13.md](phase-13.md) |
| `UX-DEL-001` | PASS — LOCAL | [implementation_evidence/phase-18.md](phase-18.md) |
| `UX-DEL-002` | PASS — LOCAL | [implementation_evidence/phase-18.md](phase-18.md) |
| `UX-DEL-003` | BLOCKED — TARGET | [implementation_evidence/phase-18.md](phase-18.md) |
| `DATA-001` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) |
| `DATA-002` | BLOCKED — TARGET | [implementation_evidence/phase-02.md](phase-02.md) |
| `DATA-003` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) |
| `DATA-004` | BLOCKED — TARGET | [implementation_evidence/phase-02.md](phase-02.md) |
| `DATA-005` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) |
| `PRIV-001` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-26.md](phase-26.md) |
| `PRIV-002` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) |
| `PRIV-003` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) |
| `PRIV-004` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) |
| `SEC-001` | PASS — LOCAL | [implementation_evidence/phase-03.md](phase-03.md) |
| `SEC-002` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) |
| `SEC-003` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) |
| `SEC-004` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) |
| `SEC-005` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) |
| `SEC-006` | PASS — LOCAL | [implementation_evidence/phase-05.md](phase-05.md) |
| `REL-001` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `REL-002` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `REL-003` | PASS — LOCAL | [rectification phase 09](nonconformance_rectification_plan/phase-09.md) |
| `REL-004` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-18.md](phase-18.md) |
| `REL-005` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `REL-006` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) |
| `REL-007` | PASS — LOCAL | [implementation_evidence/phase-16.md](phase-16.md) |
| `REL-008` | BLOCKED — TARGET | [implementation_evidence/ui-provisioning-remediation-2.2.0/phase-08.md](ui-provisioning-remediation-2.2.0/phase-08.md) |
| `QA-001` | BLOCKED — TARGET | [implementation_evidence/phase-27.md](phase-27.md) |
| `QA-002` | BLOCKED — TARGET | [implementation_evidence/phase-27.md](phase-27.md) |
| `QA-003` | PASS — LOCAL | [implementation_evidence/phase-01.md](phase-01.md) |
| `UX-VIS-001` | BLOCKED — TARGET | [implementation_evidence/legacy-awesome-button/final-status.md](legacy-awesome-button/final-status.md) |
| `UX-VIS-002` | BLOCKED — TARGET | [implementation_evidence/legacy-awesome-button/final-status.md](legacy-awesome-button/final-status.md) |

## Acceptance criteria

| Criterion | Status | Evidence pointer |
|---|---|---|
| `AC-CON-001` | BLOCKED — TARGET | [implementation_evidence/phase-01.md](phase-01.md) — required hardware/APK/WAN proof unavailable |
| `AC-CON-002` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) — required hardware/APK/WAN proof unavailable |
| `AC-CON-003` | PASS — LOCAL | [implementation_evidence/phase-01.md](phase-01.md) — local implementation/tests |
| `AC-CON-004` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) — required hardware/APK/WAN proof unavailable |
| `AC-CON-005` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) — local implementation/tests |
| `AC-CON-006` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-16.md](phase-16.md) — implementation exists; dedicated acceptance execution remains |
| `AC-CON-007` | BLOCKED — TARGET | [implementation_evidence/phase-27.md](phase-27.md) — required hardware/APK/WAN proof unavailable |
| `AC-CON-008` | PASS — LOCAL | [implementation_evidence/phase-26.md](phase-26.md) — local implementation/tests |
| `AC-CON-009` | BLOCKED — TARGET | [implementation_evidence/phase-13.md](phase-13.md) — required hardware/APK/WAN proof unavailable |
| `AC-CON-010` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) — local implementation/tests |
| `AC-FR-001` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-16.md](phase-16.md) — implementation exists; dedicated acceptance execution remains |
| `AC-FR-002` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-FR-003` | PASS — LOCAL | [implementation_evidence/phase-16.md](phase-16.md) — local implementation/tests |
| `AC-FR-004` | PASS — LOCAL | [implementation_evidence/phase-16.md](phase-16.md) — local implementation/tests |
| `AC-FR-005` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) — required hardware/APK/WAN proof unavailable |
| `AC-FR-006` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) — required hardware/APK/WAN proof unavailable |
| `AC-FR-007` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) — required hardware/APK/WAN proof unavailable |
| `AC-FR-008` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-FR-009` | BLOCKED — TARGET | [implementation_evidence/phase-20.md](phase-20.md) — required hardware/APK/WAN proof unavailable |
| `AC-FR-010` | PASS — LOCAL | [implementation_evidence/phase-17.md](phase-17.md) — local implementation/tests |
| `AC-FR-011` | BLOCKED — TARGET | [implementation_evidence/phase-15.md](phase-15.md) — required hardware/APK/WAN proof unavailable |
| `AC-FR-012` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-FR-013` | PASS — LOCAL | [rectification phase 02](nonconformance_rectification_plan/phase-02.md) — typed Hue editor/catalog boundary and focused tests |
| `AC-FR-014` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-18.md](phase-18.md) — implementation exists; dedicated acceptance execution remains |
| `AC-FR-015` | BLOCKED — TARGET | [implementation_evidence/phase-17.md](phase-17.md) — required hardware/APK/WAN proof unavailable |
| `AC-FR-016` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-HUE-001` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-002` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-003` | BLOCKED — TARGET | [implementation_evidence/phase-05.md](phase-05.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-004` | PASS — LOCAL | [rectification phase 03](nonconformance_rectification_plan/phase-03.md) — Light controls, capability gating, and subpath tests |
| `AC-HUE-005` | PASS — LOCAL | [rectification phase 03](nonconformance_rectification_plan/phase-03.md) — Group membership/class/action controls and subpath tests |
| `AC-HUE-006` | PASS — LOCAL | [rectification phase 04](nonconformance_rectification_plan/phase-04.md) — GroupScene/LightScene and per-light controls |
| `AC-HUE-007` | PASS — LOCAL | [rectification phase 05](nonconformance_rectification_plan/phase-05.md) — Sensor inspection/configuration/create controls |
| `AC-HUE-008` | PASS — LOCAL | [rectification phase 06](nonconformance_rectification_plan/phase-06.md) — Structured Rule controls and policy tests |
| `AC-HUE-009` | PASS — LOCAL | [rectification phase 07](nonconformance_rectification_plan/phase-07.md) — Structured Schedule patterns/commands |
| `AC-HUE-010` | BLOCKED — TARGET | [implementation_evidence/phase-12.md](phase-12.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-011` | BLOCKED — TARGET | [implementation_evidence/phase-12.md](phase-12.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-012` | BLOCKED — TARGET | [implementation_evidence/phase-04.md](phase-04.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-013` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) — local implementation/tests |
| `AC-HUE-014` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) — local implementation/tests |
| `AC-HUE-015` | PASS — LOCAL | [rectification phase 05](nonconformance_rectification_plan/phase-05.md) — explicit feedback, status-before-start, and foreground polling tests |
| `AC-HUE-016` | PASS — LOCAL | [implementation_evidence/phase-11.md](phase-11.md) — local implementation/tests |
| `AC-HUE-017` | BLOCKED — TARGET | [implementation_evidence/phase-23.md](phase-23.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-018` | BLOCKED — TARGET | [implementation_evidence/phase-24.md](phase-24.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-019` | BLOCKED — TARGET | [implementation_evidence/phase-24.md](phase-24.md) — required hardware/APK/WAN proof unavailable |
| `AC-HUE-020` | PASS — LOCAL | [rectification phase 02](nonconformance_rectification_plan/phase-02.md) — changed-field serializers and boundary enforcement |
| `AC-TPL-001` | BLOCKED — TARGET | [implementation_evidence/phase-13.md](phase-13.md) — required hardware/APK/WAN proof unavailable |
| `AC-TPL-002` | PASS — LOCAL | [implementation_evidence/phase-25.md](phase-25.md) — local implementation/tests |
| `AC-TPL-003` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) — local implementation/tests |
| `AC-TPL-004` | BLOCKED — TARGET | [implementation_evidence/phase-13.md](phase-13.md) — required hardware/APK/WAN proof unavailable |
| `AC-TPL-005` | VERIFIED — LOCAL; TARGET MODEL PENDING | [rectification phase 08](nonconformance_rectification_plan/phase-08.md) — parsed identity/status information reaches the UI |
| `AC-TPL-006` | BLOCKED — TARGET | [implementation_evidence/phase-14.md](phase-14.md) — required hardware/APK/WAN proof unavailable |
| `AC-TPL-007` | BLOCKED — TARGET | [implementation_evidence/phase-25.md](phase-25.md) — required hardware/APK/WAN proof unavailable |
| `AC-TPL-008` | VERIFIED — LOCAL; TARGET MODEL PENDING | [rectification phase 08](nonconformance_rectification_plan/phase-08.md) — capability-gated energy request/display tests |
| `AC-TPL-009` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-25.md](phase-25.md) — implementation exists; dedicated acceptance execution remains |
| `AC-TPL-010` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-25.md](phase-25.md) — implementation exists; dedicated acceptance execution remains |
| `AC-TPL-011` | PASS — LOCAL | [implementation_evidence/phase-13.md](phase-13.md) — local implementation/tests |
| `AC-UX-DEL-001` | PASS — LOCAL | [implementation_evidence/phase-18.md](phase-18.md) — local implementation/tests |
| `AC-UX-DEL-002` | PASS — LOCAL | [implementation_evidence/phase-18.md](phase-18.md) — local implementation/tests |
| `AC-UX-DEL-003` | BLOCKED — TARGET | [implementation_evidence/phase-18.md](phase-18.md) — required hardware/APK/WAN proof unavailable |
| `AC-DATA-001` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) — local implementation/tests |
| `AC-DATA-002` | BLOCKED — TARGET | [implementation_evidence/phase-02.md](phase-02.md) — required hardware/APK/WAN proof unavailable |
| `AC-DATA-003` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) — local implementation/tests |
| `AC-DATA-004` | BLOCKED — TARGET | [implementation_evidence/phase-02.md](phase-02.md) — required hardware/APK/WAN proof unavailable |
| `AC-DATA-005` | PASS — LOCAL | [implementation_evidence/phase-02.md](phase-02.md) — local implementation/tests |
| `AC-PRIV-001` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-26.md](phase-26.md) — implementation exists; dedicated acceptance execution remains |
| `AC-PRIV-002` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) — required hardware/APK/WAN proof unavailable |
| `AC-PRIV-003` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) — required hardware/APK/WAN proof unavailable |
| `AC-PRIV-004` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) — required hardware/APK/WAN proof unavailable |
| `AC-SEC-001` | PASS — LOCAL | [implementation_evidence/phase-03.md](phase-03.md) — local implementation/tests |
| `AC-SEC-002` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) — local implementation/tests |
| `AC-SEC-003` | PASS — LOCAL | [implementation_evidence/phase-04.md](phase-04.md) — local implementation/tests |
| `AC-SEC-004` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) — required hardware/APK/WAN proof unavailable |
| `AC-SEC-005` | BLOCKED — TARGET | [implementation_evidence/phase-26.md](phase-26.md) — required hardware/APK/WAN proof unavailable |
| `AC-SEC-006` | PASS — LOCAL | [implementation_evidence/phase-05.md](phase-05.md) — local implementation/tests |
| `AC-REL-001` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-REL-002` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-REL-003` | PASS — LOCAL | [rectification phase 09](nonconformance_rectification_plan/phase-09.md) — one read-back/no write retry tests |
| `AC-REL-004` | BLOCKED — ADDITIONAL ACCEPTANCE | [implementation_evidence/phase-18.md](phase-18.md) — implementation exists; dedicated acceptance execution remains |
| `AC-REL-005` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-REL-006` | PASS — LOCAL | [implementation_evidence/phase-15.md](phase-15.md) — local implementation/tests |
| `AC-REL-007` | PASS — LOCAL | [implementation_evidence/phase-16.md](phase-16.md) — local implementation/tests |
| `AC-REL-008` | BLOCKED — TARGET | [implementation_evidence/ui-provisioning-remediation-2.2.0/phase-08.md](ui-provisioning-remediation-2.2.0/phase-08.md) — local bounded/clear tests pass; live recovery remains |
| `AC-QA-001` | BLOCKED — TARGET | [implementation_evidence/phase-27.md](phase-27.md) — required hardware/APK/WAN proof unavailable |
| `AC-QA-002` | BLOCKED — TARGET | [implementation_evidence/phase-27.md](phase-27.md) — required hardware/APK/WAN proof unavailable |
| `AC-QA-003` | PASS — LOCAL | [implementation_evidence/phase-01.md](phase-01.md) — local implementation/tests |
| `AC-UX-VIS-001` | BLOCKED — TARGET | [implementation_evidence/legacy-awesome-button/final-status.md](legacy-awesome-button/final-status.md) — local contract tests pass; Pixel visual/kinetic acceptance remains |
| `AC-UX-VIS-002` | BLOCKED — TARGET | [implementation_evidence/legacy-awesome-button/final-status.md](legacy-awesome-button/final-status.md) — local grid tests pass; Pixel portrait acceptance remains |

## Release gate

The local code/test gate is green. Release acceptance remains blocked until the target-gated items listed above are executed on both Pixel 9 Pro phones with the bound Hue bridge, representative HS100/HS103/HS110 devices, WAN-disabled LAN routing, a signed APK, and the characterization archive or an approved replacement fixture.
