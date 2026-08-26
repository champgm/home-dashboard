# Phase 04 — Scenes Handoff

Status: `VERIFIED — LOCAL; TARGET ACCEPTANCE PENDING`

## Scope

Primary closure: `NC-HUE-004`.

Requirements: `HUE-006`, `FR-013`.

## Implemented evidence

- [SceneEditor](../../src/ui/editors/SceneEditor.tsx) distinguishes `GroupScene` and `LightScene`, validates required group/light membership, presents recycle/appdata and read-only owner/lock/version metadata, and provides explicit activation.
- Per-light scene states use typed On/Brightness controls and the explicit [Scene light-state adapter route](../../src/protocol/hue/HueV1Adapter.ts) at `/scenes/{scene}/lightstates/{light}`.
- [Scene resource models](../../src/protocol/hue/resources/scenes.ts) retain the existing activation semantics, including LightScene activation through group `0`.

## Focused verification

- [Editor component coverage](../../test/ui/editors/managementEditors.test.tsx) checks both scene form controls and per-light action affordances.
- [Mutation-boundary coverage](../../test/protocol/hue/catalog/mutationBoundary.test.ts) asserts the exact per-light endpoint and payload validation.
- [Resource tests](../../test/protocol/hue/resources/resources.test.ts) cover GroupScene/LightScene activation and changed per-light fields.

## Disposition

Local scene management is complete. Real-bridge disposable scene persistence and cleanup remain target acceptance.
