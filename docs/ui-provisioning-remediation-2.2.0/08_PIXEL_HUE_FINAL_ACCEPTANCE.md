# Phase 08 — Pixel / Hue Final Remediation Acceptance

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-01.md` through `phase-07.md`

## Objective

Verify the remediation on the actual supported Pixel 9 Pro phones and frozen Hue bridge, close all target-gated checks, and produce a concise final remediation traceability record.

## Why this phase exists

The status-bar problem, legacy visual fidelity, and Hue link-button interaction are physical-target behaviors. This phase integrates and verifies; it must not become a rescue phase for major missing implementation.

## Authoritative requirements

Final verification of all requirements listed in `00_REQUIREMENT_PHASE_MAP.md`.

## Relevant SAD sections

- `hue_v1_design.provisioning`
- `logging_and_diagnostics`
- `runtime_components` (`CMP-UI`)
- `startup_and_readiness`
- `verification_architecture`

## In scope

### Build / install

- Build a debug/release-appropriate Android artifact using the repository's supported workflow.
- Install on both supported Pixel 9 Pro phones.

### Safe-area verification

- In portrait, capture screenshots showing Android clock/battery/signal and the complete top-tab strip.
- Verify no system-status overlay covers tabs or required controls.
- Check supported display/font settings required by `AC-QA-001`.

### Legacy visual verification

Compare against `screenshot1.png`, `screenshot2.png`, `screenshot3.png` and `src/tabs/common/Button.tsx` for the specified contract, not pixel-perfect obsolete-library rendering:

- compact square raised tile;
- Favorite lower-left image control;
- Edit lower-right image control where applicable;
- Solarized state mapping;
- actual translucent question-mark image overlay;
- no inline dashboard Delete;
- four-across/legacy-density behavior appropriate to Pixel portrait width where the 2.2.0 SAD specifies it.

### Hue provisioning verification

Use a phone/application state where first provisioning is legitimately available.

1. Confirm configured bridge IP is present.
2. Without pressing the link button, invoke provisioning once.
3. Verify the request is not instantaneous due to a local path bug; verify the returned Hue rejection is categorized and shows safe useful detail (expected link-button rejection if the bridge returns it).
4. Press the physical Hue link button.
5. Invoke provisioning.
6. Verify local credential creation, authenticated `/config`, bridgeId capture, protected binding persistence, and Ready state.
7. Verify no credential appears in UI/logcat/application diagnostics.

### Diagnostics verification

- Make Hue bridge temporarily unreachable by a safe local test method or test endpoint override; verify one current Hue bridge diagnostic, not seven resource-family duplicates.
- Restore reachability; verify it clears.
- Make at least two configured plug endpoints fail independently; verify one diagnostic per endpoint with identifying technical detail.
- Restore one; verify only that diagnostic clears.
- Verify provisioning diagnostic detail remains bounded and credential-safe.

## Explicitly out of scope

- New feature implementation.
- Bridge switching/replacement.
- Visual redesign beyond the 2.2.0 contract.
- New recovery machinery.

## Expected repository changes

### Existing prerequisites

All outputs from Phases 01–07.

### Expected outputs

- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-08.md`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/final-traceability-status.md`
- target screenshots/traces under `implementation_evidence/ui-provisioning-remediation-2.2.0/artifacts/`

## Tests / commands

Run local regression first:

```sh
npm run typecheck
npm run lint
npm run test:ci
npm run doctor
git diff --check
```

Then use the repository's supported Android build/install workflow. Record exact commands and artifact hashes in evidence rather than hard-coding environment-specific ADB/EAS commands here.

## Acceptance focus

Close every criterion in the change map, especially:

- `AC-HUE-002`
- `AC-HUE-013`
- `AC-REL-006`
- `AC-REL-008`
- `AC-SEC-002`
- `AC-QA-001`
- `AC-FR-011`
- `AC-UX-VIS-001`
- `AC-UX-DEL-001..003`

## Persisted implementation evidence

Create both:

- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-08.md`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/final-traceability-status.md`

The final traceability file must list every impacted requirement and acceptance criterion with `PASS`, `FAIL`, or `BLOCKED`, plus evidence paths.

## Exit criteria

- [ ] All local tests pass.
- [ ] Safe-area visual check passes on both supported phones.
- [ ] Legacy tile contract passes physical visual review.
- [ ] Link-button-not-pressed and link-button-success provisioning paths are verified on the real bridge.
- [ ] Advanced diagnostics are de-duplicated, attributable, bounded, and clear on recovery.
- [ ] Credential-leak inspection passes.
- [ ] All target-gated items from prior phases are closed.
- [ ] Final traceability file contains no unresolved `PENDING TARGET`.
- [ ] No major implementation work was first introduced in this phase.
