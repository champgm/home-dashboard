# Phase 04 — Diagnostics Model and Advanced / Bridge UI

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-03.md`

## Objective

Replace the current flood of indistinguishable diagnostics with bounded current diagnostics that identify the failing subsystem/endpoint, preserve useful safe detail, and disappear when the condition resolves.

## Why this phase exists

A single failed Hue snapshot currently writes seven identical `hue:<kind>` diagnostic entries, and successful Hue snapshots do not clear them. Plug failures are keyed separately but the panel hides each diagnostic's resource/operation information.

## Authoritative requirements

- `REL-008` — PRIMARY
- `FR-006` — PRIMARY
- `REL-006` — supporting
- `SEC-002` — supporting
- `FR-001`, `FR-002` — supporting
- `PRIV-001`, `PRIV-002` — supporting

## Relevant SAD sections

- `logging_and_diagnostics`
- `runtime_components` (`CMP-APP`)
- `runtime_components` (`CMP-STATE`)
- `startup_and_readiness`
- `repository_structure`

## In scope

- Change Hue snapshot failure diagnostic keying from seven resource-family entries to one current bridge/snapshot diagnostic.
- Clear that Hue bridge diagnostic after a successful Hue snapshot.
- Keep one current diagnostic per plug endpoint and clear on successful plug refresh.
- Retain the Phase 03 provisioning diagnostic as an operation-specific Hue diagnostic rather than duplicating it across resource types.
- Update `DiagnosticsPanel` to show bounded fields selected by SAD 2.2.0: category, operation, technical resource/endpoint identifier, elapsed time, HTTP status / TP-Link err_code / Hue protocol code when present, and safe message/description.
- Use stable diagnostic keys; do not use array index as identity where a stable key exists.
- Optionally group by Hue / TP-Link section for readability, but do not invent new persistence.

## Explicitly out of scope

- Persistent diagnostic history.
- Remote logging or export.
- Raw request/response dumps.
- Safe-area and dashboard tile work.

## Expected repository changes

### Existing prerequisites

- `src/app/ApplicationService.ts`
- `src/app/diagnostics.ts`
- `src/app/types.ts`
- `src/ui/components/DiagnosticsPanel.tsx`
- `src/ui/screens/AdvancedHueScreen.tsx`

### Expected outputs

- updated diagnostic keying/clearing logic
- richer credential-safe `DiagnosticsPanel`
- tests such as `test/app/diagnostics/diagnostics.test.ts` and `test/ui/diagnostics/DiagnosticsPanel.test.tsx`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-04.md`

## Required implementation behavior

- One Hue snapshot failure produces one Hue bridge/snapshot diagnostic, even though all Hue resource tiles may become Unknown.
- Ten failed plugs produce at most ten plug diagnostics, each attributable to its endpoint ID/address; not ten anonymous identical lines.
- Resolved conditions are removed.
- Diagnostic rendering must not expose credentials or credential-bearing Hue paths.
- Unknown tile state remains independent of diagnostic count/presentation.

## Tests

- Failed Hue snapshot with multiple existing Hue resource kinds -> exactly one bridge diagnostic.
- Subsequent success -> bridge diagnostic removed.
- Multiple failed plugs -> one diagnostic per endpoint with correct identifier.
- One recovered plug -> only its diagnostic disappears.
- Provisioning diagnostic and bridge snapshot diagnostic can coexist without duplicate key collision.
- `DiagnosticsPanel` renders safe fields and does not render undefined/noise fields.

## Acceptance focus

- `AC-REL-008`
- `AC-REL-006`
- `AC-FR-006`
- `AC-SEC-002`

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/diagnostics test/ui/diagnostics
npm run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-04.md`.

## Exit criteria

- [ ] Hue diagnostic flood is eliminated.
- [ ] Plug diagnostics identify individual endpoints.
- [ ] Success clears current diagnostics.
- [ ] Advanced diagnostics show bounded useful detail.
- [ ] Security/redaction tests pass.
- [ ] Evidence is complete.
