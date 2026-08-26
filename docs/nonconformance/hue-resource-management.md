# Hue Resource Management Nonconformance

## Governing contract

SRS `FR-013` requires editors to expose required supported fields while preventing read-only/unsupported writes. `HUE-004..010` require applicable management for Lights, Groups, Scenes, Sensors, Rules, Schedules, and Resource Links. `HUE-020` and the SAD require changed-field-only updates. The SAD's `hue_v1_design.full_management_strategy` requires a `HueV1ResourceCatalog` enumerating writable/read-only fields which editors use and adapters enforce.

Current disposition: the local findings in this document are rectified by [rectification phases 02–07](../../implementation_evidence/nonconformance_rectification_plan/final-traceability-status.md). The original finding text below is retained as audit history; physical-bridge acceptance remains pending.

## `NC-HUE-001` — The required Hue V1 resource catalog/editor contract is not implemented

Severity: **High**  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

Only Rule and Schedule catalog modules exist. Light, Group, Scene, and Sensor resource files contain TypeScript interfaces and key arrays, but there is no unified descriptor catalog that editors can use to render type/range-aware writable fields and read-only inspection. The modern editors do not call the resource builders.

`EditorForm` is a generic Name form with limited On/Off or automation-status actions. Textual notes claim catalog behavior that the UI does not implement.

Required closure:

- catalog descriptors for every deployed/documented resource form;
- explicit writable/read-only classification, types, ranges, and endpoint/subpath;
- editor rendering driven by those descriptors;
- service/adapter validation independent of UI callers;
- positive and negative field serialization tests.

## `NC-HUE-002` — Light management is incomplete

Severity: **High**  
Requirements: `HUE-004`, `FR-013`  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

`LightEditor` renders only the generic Name field and explicit On/Off buttons. The protocol model enumerates brightness, hue, saturation, XY, color temperature, alert, effect, and transition time, but none is rendered or editable. No Light-editor tests exercise documented state fields. Search feedback is separately covered by `NC-HUE-009`.

Required closure: catalog-backed metadata/state controls, validation, changed-field payload tests, and `AC-HUE-004` fixture/live execution.

## `NC-HUE-003` — Group management is incomplete

Severity: **High**  
Requirements: `HUE-005`, `FR-013`  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

`GroupEditor` renders Name and On/Off only. It does not display/edit Light membership, Group class, supported metadata, or supported non-binary Group action fields. New Group submits only `{ name }`, so the UI cannot construct the disposable membership-bearing Group required by `AC-HUE-005`.

Required closure: membership/class editor, supported action controls, viable create payloads, serializer tests, and disposable Group acceptance.

## `NC-HUE-004` — Scene management is incomplete

Severity: **High**  
Requirements: `HUE-006`, `FR-013`  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

`SceneEditor` renders Name plus Activate. Despite its note, it provides no GroupScene/LightScene selection, Group/Light membership, or per-light state editor. New Scene submits only `{ name }`. A per-light state builder exists but no UI and no adapter operation route a per-light update.

Required closure: both Scene forms, membership, supported per-light state fields and endpoint routing, create/update tests, and `AC-HUE-006` execution.

## `NC-HUE-006` — Rule management is incomplete

Severity: **High**  
Requirements: `HUE-008`, `FR-013`  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

`RuleEditor` renders Name and generic Enable/Disable only. It does not display or edit conditions/actions although its note claims they are structured catalog values. New Rule submits only `{ name }`, which cannot represent the condition/action form required by the SRS. This also prevents inspection and repair of Rules that bind a dimmer Sensor's button events to Lights, Groups, or Scenes.

Required closure: structured condition/action controls using the existing catalog and policy, viable creation, reverse references for Sensor diagnosis or equivalent inspection, round-trip tests, and disposable Rule acceptance.

## `NC-HUE-007` — Schedule management is incomplete

Severity: **High**  
Requirements: `HUE-009`, `FR-013`  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

`ScheduleEditor` renders Name, Enable/Disable, and explicit command-authorization rebuild. It does not render description, time-pattern forms, autodelete/recurrence fields, or structured command controls. New Schedule submits only `{ name }`. The explicit rebuild mechanism is present but does not substitute for Schedule management.

Required closure: documented time-pattern and command controls, viable create/update payloads, round-trip tests, and disposable Schedule acceptance.

## `NC-HUE-008` — Changed-field-only update enforcement is incomplete

Severity: **Medium**  
Requirements: `HUE-020`, `FR-013`  
Decisions: SAD full-management strategy and partial updates  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

Resource-specific `build*Update` helpers exist, but `ApplicationService.mutateHue` and `HueV1Adapter.mutate` do not invoke them. The Resource Link editor constructs and sends `class`, `description`, and `links` on every save, including unchanged values. Sensor updates accept whole nested `config`/`state` records without nested changed-field or read-only enforcement.

The current generic Name editors happen to send a small Name-only payload, and unchanged Schedule command omission/rebuild is implemented. Those partial successes do not satisfy the cross-resource requirement.

Required closure:

- route all updates through resource-specific catalog validation/serialization;
- calculate nested changed fields where applicable;
- omit unchanged Resource Link fields;
- reject unsupported/read-only fields at the service/adapter boundary;
- test open/save unchanged and one-field edits for every resource kind.

## Other Hue disposition

Sensor-specific gaps and search lifecycle are detailed in [sensor-and-dimmer.md](./sensor-and-dimmer.md). Resource Link CRUD fields exist, but live `AC-HUE-010` remains pending. Provisioning, permanent binding, identity verification, response classification, rate limiting, bridge reads, and action policy were not found locally nonconformant in this audit; their target-blocked items remain unresolved rather than being promoted to Pass.
