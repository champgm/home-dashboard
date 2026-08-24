# Home Dashboard UI / Hue Provisioning Remediation Plan — 2.2.0

## Authority

This change plan starts from the repository's approved `docs/SRS_2.1.0.yaml` and `docs/SAD_2.1.0.yaml`.

Phase 01 exists because the stakeholder has now made two user-visible expectations explicit that are not precise enough in 2.1.0: the established legacy resource-tile visual contract and useful de-duplicated Advanced diagnostics. Phase 01 must produce and approve `docs/SRS_2.2.0.yaml` and `docs/SAD_2.2.0.yaml` before code phases begin.

- The SRS defines **what must be true**.
- The SAD defines **how the selected implementation satisfies the SRS**.
- These phase files define only order, dependencies, deliverables, verification, and exit criteria.
- If implementation exposes a new SRS ambiguity, stop and flag an SRS revision.
- If implementation exposes an architectural contradiction, stop and flag a SAD revision.
- Do not use this remediation to re-open `decision_guardrails.DG-001..DG-006`.

## Repository-root path conventions

All paths are repository-root-relative. Before Phase 01, the repository must contain at least:

- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `docs/validate_home_dashboard_docs_2.1.0.py`
- `src/protocol/hue/HueV1Adapter.ts`
- `src/protocol/hue/httpTransport.ts`
- `src/app/HueProvisioningService.ts`
- `src/app/ApplicationService.ts`
- `src/ui/navigation/AppNavigation.tsx`
- `src/ui/components/ResourceTile.tsx`
- `src/ui/components/DiagnosticsPanel.tsx`
- `src/ui/editors/EditorForm.tsx`
- `src/tabs/common/Button.tsx` — legacy visual reference only; it must not become an active second UI runtime
- `src/tabs/common/Style.ts` — legacy palette/geometry reference only
- `assets/edit.png`
- `assets/favorite.png`
- `assets/questionMark.png`
- `screenshot1.png`, `screenshot2.png`, `screenshot3.png` — legacy visual references

This plan is intended to live at:

`docs/implementation_plan/ui-provisioning-remediation-2.2.0/`

Phase evidence is written to:

`implementation_evidence/ui-provisioning-remediation-2.2.0/phase-XX.md`

## Phase execution rules

1. Execute phases sequentially.
2. Treat each phase as one branch/commit/review boundary.
3. Phase 01 is a hard authority gate: no code change from Phases 02–08 begins until SRS/SAD 2.2.0 are approved.
4. Tests are added with each correction, not deferred to Phase 08.
5. Do not reintroduce the obsolete `react-native-really-awesome-button` dependency merely to imitate the old UI. Reproduce the visual contract with the modern stack selected by the SAD.
6. Do not add cloud diagnostics, telemetry, remote logging, or credential-bearing log output.
7. Do not change permanent single-bridge behavior, configuration-overlay semantics, Hue V1 resource scope, TP-Link protocol behavior, or accepted recovery simplifications.
8. Do not turn the Advanced page into a raw device-payload dump. Diagnostics remain bounded and credential-safe.
9. The old `src/tabs/**` implementation remains reference material only. Do not import it into the active runtime.

## Testing expectations

Use the repository scripts from the repository root:

```sh
npm run typecheck
npm run lint
npm run test:ci
npm run doctor
git diff --check
```

Focused Jest paths are encouraged within phases, followed by the full suite at phase exit when practical.

UI phases must include component tests. Pixel visual checks are target-gated and close in Phase 08. Hue link-button tests against the real bridge are also target-gated and close in Phase 08.

## Observability expectations

Any phase that changes provisioning or diagnostics must prove all of the following:

- the failure category remains distinguishable;
- the user sees enough bounded detail to understand whether the failure was network, timeout, Hue protocol rejection/link-button, authentication, or storage;
- elapsed time/status/protocol code/description are preserved when safe and available;
- credentials and credential-bearing `/api/<username>/...` paths are never surfaced;
- resolved diagnostics are cleared rather than accumulated forever.

## Target-gated work

The following may be recorded `PENDING TARGET` before Phase 08:

- Pixel 9 Pro status-bar/safe-area visual verification;
- visual comparison against the legacy dashboard controls on physical screen dimensions;
- live Hue link-button create-user success;
- live Hue link-button-not-pressed rejection detail;
- live Advanced diagnostics under unreachable Hue/plug conditions.

Local implementation/tests must still complete before deferral.

## Completion / handoff protocol

Every phase creates or updates `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-XX.md` using `99_PHASE_HANDOFF_TEMPLATE.md`.

A phase is complete only when:

- all in-scope code/document work exists;
- required local tests pass;
- target-gated work is either passed or explicitly `PENDING TARGET` where permitted;
- evidence is persisted;
- no SRS/SAD defect is silently deferred;
- later-phase work has not been pulled forward without justification.

## Phase index

| Phase | Objective | Depends on |
|---:|---|---|
| 01 | Authoritative 2.2.0 spec/design revision | none |
| 02 | Correct Hue create-user protocol path and transport tests | 01 |
| 03 | Preserve useful provisioning error detail end-to-end | 02 |
| 04 | De-duplicate and improve Advanced diagnostics | 03 |
| 05 | Fix Android safe-area / top-tab status-bar overlap | 01 |
| 06 | Recreate the legacy resource-tile visual component | 01, 05 |
| 07 | Integrate legacy tiles and relocate destructive delete to editors | 06 |
| 08 | Pixel + real-Hue end-to-end remediation acceptance | 02–07 |

## Context-pressure rationale

The plan deliberately does **not** combine:

- Hue HTTP correctness with UI diagnostics;
- provisioning diagnostics with persistent dashboard diagnostics;
- safe-area/navigation work with tile visual reconstruction;
- tile styling with delete-confirmation relocation;
- local deterministic tests with real-device acceptance.

Those boundaries keep each coding-LLM prompt focused on one small technical model.
