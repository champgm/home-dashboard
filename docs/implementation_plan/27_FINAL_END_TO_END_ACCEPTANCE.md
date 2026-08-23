# Phase 27 — Final End-to-End Acceptance and Traceability Closure

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 01, Phase 02, Phase 03, Phase 04, Phase 05, Phase 06, Phase 07, Phase 08, Phase 09, Phase 10, Phase 11, Phase 12, Phase 13, Phase 14, Phase 15, Phase 16, Phase 17, Phase 18, Phase 19, Phase 20, Phase 21, Phase 22, Phase 23, Phase 24, Phase 25, Phase 26

## Objective

Integrate and verify the complete approved SRS/SAD on both Pixel 9 Pro phones, reconcile every acceptance criterion and target-gated item, and produce final implementation traceability evidence without implementing major missing subsystems.

## Why this phase exists

The final phase is for integration and proof. If a major feature is missing here, stop and reopen its owning phase rather than implementing it ad hoc in acceptance.

## Authoritative requirements

- **constraints:** `CON-001`, `CON-002`, `CON-003`, `CON-004`, `CON-005`, `CON-006`, `CON-007`, `CON-008`, `CON-009`, `CON-010`
- **functional:** `FR-001`, `FR-002`, `FR-003`, `FR-004`, `FR-005`, `FR-006`, `FR-007`, `FR-008`, `FR-009`, `FR-010`, `FR-011`, `FR-012`, `FR-013`, `FR-014`, `FR-015`, `FR-016`
- **hue:** `HUE-001`, `HUE-002`, `HUE-003`, `HUE-004`, `HUE-005`, `HUE-006`, `HUE-007`, `HUE-008`, `HUE-009`, `HUE-010`, `HUE-011`, `HUE-012`, `HUE-013`, `HUE-014`, `HUE-015`, `HUE-016`, `HUE-017`, `HUE-018`, `HUE-019`, `HUE-020`
- **tplink:** `TPL-001`, `TPL-002`, `TPL-003`, `TPL-004`, `TPL-005`, `TPL-006`, `TPL-007`, `TPL-008`, `TPL-009`, `TPL-010`, `TPL-011`
- **destructive_actions:** `UX-DEL-001`, `UX-DEL-002`, `UX-DEL-003`
- **data_and_persistence:** `DATA-001`, `DATA-002`, `DATA-003`, `DATA-004`, `DATA-005`
- **privacy:** `PRIV-001`, `PRIV-002`, `PRIV-003`, `PRIV-004`
- **security:** `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `SEC-005`, `SEC-006`
- **runtime_and_failure_semantics:** `REL-001`, `REL-002`, `REL-003`, `REL-004`, `REL-005`, `REL-006`, `REL-007`
- **quality_attributes:** `QA-001`, `QA-002`, `QA-003`
- Primary ownership in this phase: `CON-007`, `QA-001`, `QA-002`. Full normative text remains authoritative in `SRS_2.0.0.yaml`.

## Relevant SAD sections

- `SAD_2.0.0.yaml:verification_architecture`
- `SAD_2.0.0.yaml:baseline_readiness`
- `SAD_2.0.0.yaml:accepted_architectural_risks`
- `SAD_2.0.0.yaml:implementation_constraints`

## In scope

- Run all automated unit/integration/security tests from a clean install.
- Use `00_REQUIREMENT_PHASE_MAP.md` and every `implementation_evidence/phase-XX.md` to reconcile requirement ownership.
- Execute every SRS acceptance criterion, including live Hue/TP-Link tests where required.
- Install the exact Phase 26 signed release APK on both Pixel 9 Pro phones.
- Verify WAN-disabled control, independent phone config, foreground/background behavior, full resource navigation/editors, provisioning/reauthorization where safely target-gated, TP-Link HS100/HS103/HS110, delete confirmation, privacy/security/backup, diagnostics, and portrait layout.
- Create `implementation_evidence/final-traceability-status.md` containing every mandatory requirement and every acceptance criterion with Pass/Fail/Blocked + evidence pointer.
- Resolve every pending target-gated check or declare the release blocked.

## Explicitly out of scope

- Major new subsystem implementation
- Requirement reinterpretation
- Architecture changes

## Expected repository changes

### Existing prerequisite files/directories

- artifacts/home-dashboard-release.apk
- SRS_2.0.0.yaml
- SAD_2.0.0.yaml
- implementation_evidence/phase-01.md
- implementation_evidence/phase-02.md
- implementation_evidence/phase-03.md
- implementation_evidence/phase-04.md
- implementation_evidence/phase-05.md
- implementation_evidence/phase-06.md
- implementation_evidence/phase-07.md
- implementation_evidence/phase-08.md
- implementation_evidence/phase-09.md
- implementation_evidence/phase-10.md
- implementation_evidence/phase-11.md
- implementation_evidence/phase-12.md
- implementation_evidence/phase-13.md
- implementation_evidence/phase-14.md
- implementation_evidence/phase-15.md
- implementation_evidence/phase-16.md
- implementation_evidence/phase-17.md
- implementation_evidence/phase-18.md
- implementation_evidence/phase-19.md
- implementation_evidence/phase-20.md
- implementation_evidence/phase-21.md
- implementation_evidence/phase-22.md
- implementation_evidence/phase-23.md
- implementation_evidence/phase-24.md
- implementation_evidence/phase-25.md
- implementation_evidence/phase-26.md
- `implementation_evidence/phase-01.md` (output of Phase 01)
- `implementation_evidence/phase-02.md` (output of Phase 02)
- `implementation_evidence/phase-03.md` (output of Phase 03)
- `implementation_evidence/phase-04.md` (output of Phase 04)
- `implementation_evidence/phase-05.md` (output of Phase 05)
- `implementation_evidence/phase-06.md` (output of Phase 06)
- `implementation_evidence/phase-07.md` (output of Phase 07)
- `implementation_evidence/phase-08.md` (output of Phase 08)
- `implementation_evidence/phase-09.md` (output of Phase 09)
- `implementation_evidence/phase-10.md` (output of Phase 10)
- `implementation_evidence/phase-11.md` (output of Phase 11)
- `implementation_evidence/phase-12.md` (output of Phase 12)
- `implementation_evidence/phase-13.md` (output of Phase 13)
- `implementation_evidence/phase-14.md` (output of Phase 14)
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-16.md` (output of Phase 16)
- `implementation_evidence/phase-17.md` (output of Phase 17)
- `implementation_evidence/phase-18.md` (output of Phase 18)
- `implementation_evidence/phase-19.md` (output of Phase 19)
- `implementation_evidence/phase-20.md` (output of Phase 20)
- `implementation_evidence/phase-21.md` (output of Phase 21)
- `implementation_evidence/phase-22.md` (output of Phase 22)
- `implementation_evidence/phase-23.md` (output of Phase 23)
- `implementation_evidence/phase-24.md` (output of Phase 24)
- `implementation_evidence/phase-25.md` (output of Phase 25)
- `implementation_evidence/phase-26.md` (output of Phase 26)

### Expected outputs created or materially modified by this phase

- implementation_evidence/phase-27.md
- implementation_evidence/final-traceability-status.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- No acceptance failure may be waived silently.
- If implementation reveals an SRS ambiguity, stop and require SRS revision.
- If mechanism contradicts/is impractical under SAD, stop and require SAD revision.
- Accepted risks DG-001..DG-006/RISK-* are not defects unless stakeholder requirements change.

## Tests

- Complete SRS traceability matrix.
- Every acceptance criterion exactly reconciled to evidence.
- Both-phone signed-APK smoke suite.
- Live frozen Hue bridge and representative HS100/HS103/HS110 control.
- WAN-disabled operation.
- Portrait layout and destructive-action interaction inspection.
- Final privacy/security/permissions/backup/logging inspection.

### Target-gated verification

- All remaining live-device checks must be closed here. This includes both Pixel 9 Pro phones, the permanently bound Hue bridge, representative deployed HS100/HS103/HS110 plugs, WAN-disabled LAN operation, signed APK installation/update, and any provisioning/reauthorization checks deferred by Phases 23-24.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-27.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-001`, `AC-CON-002`, `AC-CON-003`, `AC-CON-004`, `AC-CON-005`, `AC-CON-006`, `AC-CON-007`, `AC-CON-008`, `AC-CON-009`, `AC-CON-010`, `AC-FR-001`, `AC-FR-002`
- `AC-FR-003`, `AC-FR-004`, `AC-FR-005`, `AC-FR-006`, `AC-FR-007`, `AC-FR-008`, `AC-FR-009`, `AC-FR-010`, `AC-FR-011`, `AC-FR-012`, `AC-FR-013`, `AC-FR-014`
- `AC-FR-015`, `AC-FR-016`, `AC-HUE-001`, `AC-HUE-002`, `AC-HUE-003`, `AC-HUE-004`, `AC-HUE-005`, `AC-HUE-006`, `AC-HUE-007`, `AC-HUE-008`, `AC-HUE-009`, `AC-HUE-010`
- `AC-HUE-011`, `AC-HUE-012`, `AC-HUE-013`, `AC-HUE-014`, `AC-HUE-015`, `AC-HUE-016`, `AC-HUE-017`, `AC-HUE-018`, `AC-HUE-019`, `AC-HUE-020`, `AC-TPL-001`, `AC-TPL-002`
- `AC-TPL-003`, `AC-TPL-004`, `AC-TPL-005`, `AC-TPL-006`, `AC-TPL-007`, `AC-TPL-008`, `AC-TPL-009`, `AC-TPL-010`, `AC-TPL-011`, `AC-UX-DEL-001`, `AC-UX-DEL-002`, `AC-UX-DEL-003`
- `AC-DATA-001`, `AC-DATA-002`, `AC-DATA-003`, `AC-DATA-004`, `AC-DATA-005`, `AC-PRIV-001`, `AC-PRIV-002`, `AC-PRIV-003`, `AC-PRIV-004`, `AC-SEC-001`, `AC-SEC-002`, `AC-SEC-003`
- `AC-SEC-004`, `AC-SEC-005`, `AC-SEC-006`, `AC-REL-001`, `AC-REL-002`, `AC-REL-003`, `AC-REL-004`, `AC-REL-005`, `AC-REL-006`, `AC-REL-007`, `AC-QA-001`, `AC-QA-002`
- `AC-QA-003`
- Execute the authoritative criterion text from `SRS_2.0.0.yaml:acceptance_criteria`; this compact ID list is only a coverage index.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm ci
npx expo-doctor
npm run typecheck
npm run lint
npm run test:ci
npx expo export --platform android
apksigner verify --print-certs artifacts/home-dashboard-release.apk
adb install -r artifacts/home-dashboard-release.apk
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-27.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

At minimum record:

- work completed;
- primary/supporting requirement IDs;
- tests/checks and actual results;
- acceptance criteria exercised;
- materially changed files;
- known limitations;
- target-dependent checks not yet performed;
- deviations or discovered SRS/SAD problems;
- handoff notes.

## Exit criteria

- [ ] Every in-scope implementation item exists and follows the listed SAD sections.
- [ ] All non-target-gated tests/checks required by this phase pass.
- [ ] Every target-gated item is either passed with evidence or explicitly recorded `PENDING TARGET` where this phase permits deferral.
- [ ] `implementation_evidence/phase-27.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
