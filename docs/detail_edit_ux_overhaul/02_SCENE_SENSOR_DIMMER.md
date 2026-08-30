# Phase 02 — Scene, Sensor, Configure Dimmer — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Objective

Apply summary-driven editing to nested state and preserve the already-successful physical-dimmer workflow.

Depends on Phase 01.

## Scene

- keep name and activation prominent;
- show membership/type concisely;
- replace expanded per-light state fields with one summary row/card per light;
- edit one light state at a time using the simplest focused interaction consistent with Phase 01;
- keep exact color values secondary;
- preserve current GroupScene/LightScene serialization and validation.

## Sensor

- keep recognized-dimmer routing and Configure Dimmer prominent;
- keep battery/reachable/enabled/useful household state compact;
- move type/model/unique ID/raw state/capabilities/exact references under Details/Advanced;
- do not imply unsupported sensor state is writable.

## Configure Dimmer

- retain physical control/gesture summaries;
- use human-readable action + target rows;
- reuse the Phase 01 resource selector for Light/Group/Scene targets where practical;
- keep exact IDs/raw events/references/provenance secondary;
- preserve missing-target repair behavior;
- preserve structural preview/confirmation and sequential failure/refresh behavior;
- keep unrecognized/custom automation visible but non-editable.

## Tests

Focus on behavior, not layout snapshots:

- Scene parent shows summaries rather than all state fields;
- one light-state edit changes the parent draft and main Save remains the remote commit boundary;
- exact Scene state values still serialize correctly;
- recognized dimmer normal view hides raw technical detail until opened;
- target selection preserves exact resource identity;
- existing simple repair and structural dimmer suites remain green.

Run typecheck, Scene/Sensor UI tests, all dimmer UI/app tests, and relevant mutation/action-policy tests.

## Exit

Scene is compact by default; Sensor/Configure Dimmer retain their working device-oriented semantics with less technical clutter.
