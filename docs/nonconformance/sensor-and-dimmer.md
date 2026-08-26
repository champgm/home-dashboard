# Sensor and Dimmer-Switch Nonconformance

Current disposition: `NC-HUE-005` and `NC-HUE-009` are closed locally by [rectification phase 05](../../implementation_evidence/nonconformance_rectification_plan/phase-05.md); the pre-rectification findings below remain as audit history and still require physical-device acceptance.

## `NC-HUE-005` — Sensor management is incomplete

Severity: **High**  
Requirements: `HUE-003`, `HUE-007`, `FR-013`, `AC-FR-013`, `AC-HUE-007`  
Decisions: SAD full-management strategy, partial updates, and Sensor semantics  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

### Missing Sensor catalog

`src/protocol/hue/resources/sensors.ts` models `state`, `config`, and `capabilities` as undifferentiated records. It does not classify fields by Sensor type or writable/read-only status, validate types/ranges, or describe the correct state/configuration operation subpath.

### Missing inspection and configuration UI

`SensorEditor` exposes Name plus Set enabled/disabled. It does not display type, model, unique ID, capabilities, reachability, battery, button event, last update, or returned configuration. It provides no model-aware writable configuration beyond `config.on`.

### Incomplete creation

New Sensor submits only `{ name }`; there is no supported Sensor-form selection or validated type/model/manufacturer/state/config payload.

### Incomplete/unsafe update route

The Sensor builder admits whole `config` and `state` objects plus identity metadata without nested changed-field or read-only classification. That builder is not invoked by the service/adapter. Sensor enable/disable calls generic mutation with `{ config: { on } }` against the Sensor resource root rather than a catalog-described Sensor configuration operation.

### Required closure

- catalog the deployed/documented Sensor types and fields;
- render read-only state/config/capability data;
- render only applicable writable controls;
- implement correct configuration/state operation routing;
- implement viable supported creation forms;
- enforce nested changed fields and reject read-only writes;
- add Sensor editor/protocol tests and disposable live-fixture acceptance.

## `NC-HUE-009` — Search status lifecycle and feedback are incomplete

Severity: **Medium**  
Requirement: `HUE-015`  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

The protocol checks status before POST, but the UI discards the result of `startHueSearch`. Passive recent/inactive dashboard status is intentionally hidden; when an explicit Scan is refused because the bridge reports active/recent status, the UI therefore provides no action feedback. `HueSearchStatusView` reads once on mount and does not poll while active or coordinate polling with foreground/background lifecycle.

Required closure:

- keep passive inactive/recent dashboard UI hidden;
- show bounded active/recent feedback after an explicit Scan attempt;
- poll only while active and foregrounded;
- stop/abandon polling on background and retest status on foreground;
- cover restart/background/no-durable-journal behavior.

## Dimmer-switch diagnostic boundary

A Hue dimmer commonly exposes button events through one or more Sensor resources while Hue Rules map those events to Light, Group, or Scene actions. The Rule gap `NC-HUE-006` means the application cannot currently inspect or repair those bindings.

Do not mutate/delete household resources to discover the fault. First correlate:

1. all Sensor resources sharing the dimmer's physical identity;
2. their type, unique ID, state, configuration, enabled/reachable status, and changing button events;
3. all Rule conditions referencing those Sensor IDs;
4. the corresponding Rule actions and target Lights, Groups, or Scenes.

This distinguishes a disabled/unreachable Sensor from a functioning Sensor with broken Rule bindings.
