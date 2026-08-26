# Phase 02 — Hue Resource Catalog and Mutation Boundary Handoff

Status: `VERIFIED — LOCAL; TARGET ACCEPTANCE PENDING`

## Scope

Primary closures: `NC-HUE-001`, `NC-HUE-008`.

Requirements: `FR-013`, `HUE-020`.

## Implemented evidence

- [The shared Hue catalog](../../src/protocol/hue/catalog/resourceCatalog.ts) declares lights, groups, scenes, sensors, rules, schedules, and Resource Links with typed fields, ranges, enums, endpoint classes, and create/update/read-only flags.
- [The Hue adapter](../../src/protocol/hue/HueV1Adapter.ts) and [ApplicationService](../../src/app/ApplicationService.ts) validate writes before dispatch. Light state, Group action, Sensor config, and Scene per-light writes use explicit V1 subpaths.
- Changed nested fields are serialized by the catalog; unchanged schedule commands are omitted and explicit rebuilds redact credential-bearing paths.
- Creation contracts reject empty/non-viable Group, Scene, Sensor, Rule, Schedule, and Resource Link payloads; the catalog completeness check asserts the documented field-path inventory rather than only non-empty descriptor lists.
- Unknown existing resources have no Edit/Save path, and the service/catalog boundary rejects update/config preparation without a known original, so default editor values cannot be mistaken for intentional changes. The standalone Resource Link editor follows the same rule.
- [The typed editor controls](../../src/ui/editors/editorControls.tsx) are shared by the resource-specific forms. No raw JSON/path editor was added.

## Focused verification

- [Catalog tests](../../test/protocol/hue/catalog/resourceCatalog.test.ts) cover completeness, read-only/unknown/type/range rejection, changed falsy values, and schedule redaction.
- [Mutation-boundary tests](../../test/protocol/hue/catalog/mutationBoundary.test.ts) cover Sensor `/config`, Light `/state`, Group `/action`, Scene `/lightstates`, and no-network rejection.
- [Application-service and editor tests](../../test/app/commands/commandSemantics.test.ts) and [management-editor tests](../../test/ui/editors/managementEditors.test.tsx) prove unknown-original updates are rejected, including the Resource Link path.
- [Resource serializers](../../src/protocol/hue/resources/schedules.ts) preserve unchanged command omission and structured time-pattern conversion.

## Disposition

The catalog and changed-field boundary are locally verified. Real-bridge CRUD, credential reauthorization, and target-device acceptance remain pending.
