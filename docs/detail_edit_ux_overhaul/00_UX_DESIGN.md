# Detail/Edit UX Design — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Status

Selected UX direction for implementation. SRS/SAD 2.4.1 remain authoritative for resource behavior, persistence, security, protocol semantics, and dimmer architecture.

This document defines **interaction outcomes**, not a mandatory generalized component framework.

## Principles

1. **Household concepts first.** Name, current state, and human-readable targets come before Hue representation.
2. **Reduce default height.** Technical detail and uncommon controls should not make every editor a long form.
3. **Use focused interactions for large things.** Large choices and repeated structures get a list/summary plus a focused edit.
4. **Touch first, exact values second.** Keep exact Hue values available without displaying them permanently.
5. **Preserve mutation semantics.** Layout work does not change what is sent to Hue/TP-Link or when it is sent.
6. **Reuse where it helps.** Share row/disclosure/picker behavior when real screens need the same thing; do not build a complete design system in advance.
7. **Leave the dashboard alone.** Its swipe/tile interaction is the visual reference, not part of the redesign.

## Editor composition

A typical editor should resemble:

```text
< native stack header >

Bedroom
Group · 4 lights

Power                                  [on]
Name                           Bedroom
Lights                       4 selected >
Room class                     Bedroom >
Appearance                            >
Details                               >

... Save is easy to reach ...

Danger / Delete (separate, confirmed)
```

Do not duplicate generic body titles when the native stack already identifies the screen.

## Shared patterns to implement as needed

### Compact row

A row can contain a label, current value/summary, state control, or disclosure affordance. New primary pressables should normally be around 48dp high/tappable.

Likely reusable forms:

- value row;
- staged toggle row;
- immediate/live action row;
- disclosure row;
- deliberate action row.

These do not need a deep class/component taxonomy if simple composition remains clearer.

### Details / Advanced disclosure

Use the existing `ExpandableAdvancedSection` precedent or a small generalized equivalent.

Default-collapsed content can include:

- IDs and exact paths;
- model/firmware/technical state;
- raw/large objects;
- exact Hue/XY values;
- provenance/reference information;
- diagnostics/recovery detail.

Large payloads may open a separate focused view instead of expanding inline.

### Focused selection

For more than a few choices, show a summary row such as:

```text
Lights                         6 selected >
```

Opening it should show a scrollable list with large rows. Search is useful for dynamic resource lists but is not mandatory for small fixed lists.

Selection requirements:

- labels are presentation only;
- exact kind/id/path is retained separately;
- duplicate labels can include concise ID/type detail;
- an already-selected unavailable resource remains visible until removed;
- multi-select changes use local draft + explicit Done/Cancel when immediate mutation would be surprising.

Implementation may be a React Native modal, stack screen, or bounded inline focused panel. Prefer the simplest approach that avoids nested-modal complexity.

### Repeatable-item summary

Scene light states, Rule conditions/actions, and similar structures should first appear as rows/cards:

```text
Bedside left              On · 65% · Warm >
Kitchen                   Turn on          >
Top button                Press            >
```

Editing one item may use an inline one-at-a-time expansion or focused editor. The key contract is that the parent screen does not show every field for every item simultaneously.

`Done`/close updates the parent draft only unless the operation is explicitly an immediate live action. Main Save/Create remains the existing remote commit boundary.

### Range and color

Default:

- slider/touch choice;
- concise rendered value;
- no permanently duplicated exact TextInput unless the exact value is genuinely the primary edit.

Exact numeric Hue/XY/protocol values can live in Advanced or an on-demand exact entry affordance using existing validation/conversion rules.

Do not add a new color-wheel dependency for this iteration.

### Save/Create

The UX outcome is **easy reachability**, not a required footer component.

Choose the smallest workable option per shared shell:

1. compact editor with normal Save near the end;
2. stack-header Save/Create;
3. persistent bottom action area when screens still need substantial scrolling.

If a persistent footer is used, it must respect safe-area/keyboard behavior. If a header action is used, pending/disabled state must remain clear.

### Destructive action

Keep Delete/removal separated from primary save/live controls and reuse existing confirmation behavior. A simple Danger section near the end of content is sufficient.

## Control selection rules

| Data/operation | Default control |
|---|---|
| live boolean state | switch/action row that invokes existing service immediately |
| staged boolean | switch |
| 2–4 choices | compact segmented/chip group |
| many choices / resource catalog | focused list/selector |
| multi-resource membership | focused multi-select list |
| bounded numeric value | slider + concise value |
| exact numeric protocol value | Advanced/on-demand entry |
| repeatable structure | summary rows/cards + one-at-a-time edit |
| common read-only state | compact value row |
| raw/technical metadata | Details/Advanced |
| destructive action | separate confirmed action |

## Resource contracts

### Light

Default: name, live power, brightness, common color/temperature when supported.

Secondary: alert/effect/transition and exact color values.

Details: model/product/software/reachability/IDs/technical color mode.

### Group

Default: name, aggregate/live power, light membership summary, room class.

Membership and large class choices use focused lists rather than button clouds. Preserve unavailable existing light IDs until explicitly removed.

Secondary: group appearance/action values. Details: group type/sensors/technical state.

### Scene

Default: name, activation for existing scenes, membership/type summary, one row per selected light state.

Edit one light state at a time. Preserve current GroupScene/LightScene serialization and validation.

### Sensor / Configure Dimmer

Recognized dimmers remain physical-device-first. Keep Configure Dimmer prominent and retain battery/reachability/useful status in the normal view.

Configure Dimmer shows human-readable control/gesture/action/target summaries. Exact Sensor/Rule/Schedule/Resource-Link IDs, raw events, references, and provenance remain Advanced.

Simple repair and structural mutation behavior remain unchanged.

### Rule

Default: name, enabled state, concise Conditions and Actions lists.

Known structured items can be edited one at a time. Unsupported/custom existing paths remain visible/read-only until the existing explicit replacement behavior is invoked.

Friendly names must not replace exact stored paths/IDs.

### Schedule

Default: name, enabled state, concise `When`, concise `Action`, Autodelete.

Timing/command editing remains structured and uses current supported patterns. An unchanged existing command remains untouched on ordinary Save. Authorization rebuild remains an explicit recovery action.

### Plug

Default: alias, live relay, concise useful reading/status.

Details: model/device/network metadata. Endpoint administration semantics remain unchanged.

### Resource Link

Use compact class/description/link summaries and focused link selection where the existing structured model supports it. Preserve exact path values and unsupported/read-only treatment.

### Advanced / Bridge / administration

Make `AdvancedHueScreen` a compact settings index, for example:

```text
BRIDGE
Bridge configuration                  >
Bridge capabilities                   >

HUE ACCESS
Provisioning                          >
Reauthorization                       >
Resource Links                        >

PLUGS
Endpoint administration               >

DIAGNOSTICS
Current diagnostics                   >
```

Do not print large capabilities/diagnostics directly into the index. Preserve credential safety and current-only/bounded diagnostic policy.

## Feedback

- Keep success/failure text short and close to the action it describes.
- Do not append large protocol diagnostic blocks to ordinary editors.
- Unknown/unavailable resources should show one concise warning and keep unsupported mutation unavailable.
- Do not add optimistic device state solely for this UX iteration.

## Accessibility / phone usability

For this household application, use practical rather than certification-oriented checks:

- primary touch targets should normally be approximately 48dp;
- selected/disabled/expanded state should be visually obvious and exposed through native accessibility props where straightforward;
- Back/Cancel must not silently commit a local draft;
- required controls should not be hidden behind the bottom inset or keyboard on the supported Pixel 9 Pro portrait target.

## Testing strategy

Prefer tests that protect behavior likely to regress during refactoring:

- exact ID/path selection integrity;
- unavailable selected-member preservation;
- disclosure hides technical detail by default;
- repeated-item edit only changes parent draft until Save;
- immediate action still invokes the same service boundary;
- Unknown/read-only/capability guards remain closed;
- destructive confirmation remains unchanged.

Do not add snapshot/style tests for every spacing choice. Visual/touch quality is better checked in the final representative phone pass.

## Migration policy

- Create shared pieces when the first real editor needs them.
- Migrate simple editors first and adjust the pattern before applying it to complex editors.
- Small resource-specific layout composition is acceptable.
- Avoid two independent implementations of the same large-choice or destructive semantics.
- Do not rewrite protocol/application/dimmer architecture to make the UI cleaner.
