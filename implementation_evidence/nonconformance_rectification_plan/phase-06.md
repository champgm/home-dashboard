# Phase 06 — Rules and Dimmer Bindings Handoff

Status: `VERIFIED — LOCAL; TARGET ACCEPTANCE PENDING`

## Scope

Primary closure: `NC-HUE-006`.

Requirements: `HUE-008`, `HUE-016`, `FR-013`.

## Implemented evidence

- [RuleEditor](../../src/ui/editors/RuleEditor.tsx) provides structured Sensor condition rows and Light/Group/Scene action rows, including target IDs, catalog-backed brightness/color/transition fields, replacement/removal controls for malformed entries, and a validated exact-change preview. Unrecognized existing entries remain inspectable and are not converted into raw JSON editors.
- Light Rule actions are recognized and serialized through `/lights/{id}/state`; Group actions remain `/groups/{id}/action`, and the fixture-backed dimmer binding exercises the Light state form.
- [The catalog](../../src/protocol/hue/catalog/resourceCatalog.ts) constrains condition addresses/operators and action targets/bodies; [HueActionPolicy](../../src/protocol/hue/HueActionPolicy.ts) continues to reject bridge administration and resource deletion operations.
- Sensor reverse-reference inspection is shown by [SensorEditor](../../src/ui/editors/SensorEditor.tsx), allowing dimmer bindings to be correlated without mutating sensor state.
- Rule status enablement revalidates existing actions; disable/delete remain available for dangerous or unrepresentable automations. Sensor schedule targets are accepted by the action policy while bridge-level `/config` remains prohibited.

## Focused verification

- [Editor component coverage](../../test/ui/editors/managementEditors.test.tsx) verifies structured Rule controls and service payloads.
- [Catalog tests](../../test/protocol/hue/catalog/resourceCatalog.test.ts) verify typed condition/action builders and invalid target rejection.
- [Mutation-boundary tests](../../test/protocol/hue/catalog/mutationBoundary.test.ts) verify repaired brightness/transition actions are credential-bound without losing their catalog-approved body.
- [Action-policy tests](../../test/protocol/hue/actionPolicy/actionPolicy.test.ts) cover positive Sensor `/config` schedule commands and retain negative bridge-administration coverage.
- The focused management-editor regressions also require trailing Rule paths to remain unrecognized rather than being shortened during save; exact path matching now preserves the explicit replacement/removal workflow.

## Disposition

Local structured rule/dimmer repair, replacement validation, preview, and changed-field submission are verified. Disposable rule repair against a physical dimmer remains target acceptance.
