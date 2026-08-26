# Phase 05 — Sensors and Search Handoff

Status: `VERIFIED — LOCAL; TARGET ACCEPTANCE PENDING`

## Scope

Primary closures: `NC-HUE-005`, `NC-HUE-009`.

Requirements: `HUE-007`, `HUE-015`, `FR-013`.

## Implemented evidence

- [SensorEditor](../../src/ui/editors/SensorEditor.tsx) displays identity, type, capabilities, reachability, battery, state/event data, automation reverse references, and only catalog-declared writable configuration controls. New sensors use typed type/model/manufacturer fields.
- Sensor type choices and writable configuration controls are derived from the shared catalog; the supported type inventory includes the documented ZLL/Daylight/CLIP forms represented by the catalog.
- Sensor configuration is a separate `config` operation and [HueV1Adapter](../../src/protocol/hue/HueV1Adapter.ts) sends the unwrapped body to `/sensors/{id}/config`; changed nested config fields are omitted.
- [Search status](../../src/protocol/hue/search.ts) is typed. [HueV1Adapter](../../src/protocol/hue/HueV1Adapter.ts) reads `/new` before POST and refuses active/recent duplicate starts.
- V1 `{lastscan: "active"}` is classified as active, so the foreground poll is not incorrectly stopped for that bridge response shape.
- [HueSearchStatusView](../../src/ui/components/HueSearchStatus.tsx) polls only while an explicit search is active and the service is foregrounded; lifecycle changes cancel timers and late responses are ignored. [ResourceCollectionScreen](../../src/ui/screens/ResourceCollectionScreen.tsx) reports explicit start/refusal/error feedback without a passive recent banner.

## Focused verification

- [Sensor/search lifecycle tests](../../test/protocol/hue/search/searchLifecycle.test.ts) cover status-before-start and active/recent refusal.
- [Search UI tests](../../test/ui/search/HueSearchStatus.test.tsx) cover active foreground polling, background stop, and absence of passive recent feedback.
- [Editor component coverage](../../test/ui/editors/managementEditors.test.tsx) covers sensor inspection and configuration affordances.

## Disposition

Local sensor/search behavior is verified by fixture/component tests. Physical sensor discovery and dimmer-event behavior remain target acceptance.
