# Phase 01 — Compact Foundation + Light, Group, Plug — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Objective

Prove the new editor direction on real, relatively simple screens. Build only the shared pieces required by Light, Group, and Plug; do not first create a complete abstract editor framework.

## Work

1. Establish a small shared editor style/row/disclosure vocabulary using the current Solarized palette.
2. Remove redundant in-body generic editor titles where the stack header already provides the screen identity.
3. Make common pressables comfortably phone-sized (normally ~48dp target).
4. Make Save/Create easy to reach on the migrated screens using the simplest common solution that works after the pages are compact. Do not assume a fixed footer is mandatory.
5. Keep Delete separated and reuse existing confirmation semantics.
6. Distinguish immediate Light/Group power and Plug relay operations from staged edits without changing service calls.

### Light

- default: name, power, brightness, common color/temperature;
- move alert/effect/transition and exact technical values out of the primary flow;
- keep capability gating authoritative;
- retain exact Hue/XY management under secondary detail.

### Group

- default: name, aggregate/live power, `Lights — N selected`, `Room class — value`;
- replace membership and large room-class button clouds with a focused list/selector;
- preserve exact IDs and unavailable existing members;
- keep appearance/action detail secondary.

### Plug

- default: alias, relay, useful current/energy status where available;
- move model/device/network detail secondary;
- preserve endpoint/admin semantics.

## Implementation freedom

A focused selector may be a modal, stack screen, or bounded focused panel. If only Group needs the first implementation, optimize for Group and keep its interface reusable enough for later resource targets. Do not implement features such as search or generic subeditors until a real catalog requires them.

## Tests

Focused tests should prove:

- Group selection returns exact IDs and keeps an unavailable selected member;
- large class/member clouds are gone from the parent editor;
- Light capability gates and exact-value serialization still work;
- immediate power/relay calls use existing service boundaries and failures are not shown as success;
- Delete remains confirmed;
- Unknown existing resources remain non-editable as currently required.

Run typecheck plus the affected editor/destructive/command tests. If the editor shell changes broadly, run all `test/ui/editors/**`.

## Exit

Light, Group, and Plug are materially shorter and comfortable to edit; their behavior is unchanged; later phases have proven row/disclosure/selection patterns to reuse.
