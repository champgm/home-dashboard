# Detail/Edit UX Review — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Purpose

Overhaul the detail/edit/settings UX without disturbing the working Home Dashboard 2.4.1 device behavior or the swipe-page dashboard.

This is a household application for two adults controlling one home. The target is therefore pragmatic: make the editors faster and more comfortable to use on the supported phone, while avoiding a broad redesign or new framework.

## Current problem

The dashboard is compact, glanceable, and touch-first. Editors are not. The current editor architecture generally puts every field, explanation, choice, technical value, Save, Delete, and feedback into one vertical scroll flow.

The main causes are:

- `EditorForm` and `Screen` produce one long parent page;
- `EditorChoice` / `EditorMultiChoice` render option clouds regardless of option count;
- exact numeric inputs are shown beside sliders/swatches by default;
- Scene, Rule, Schedule, and dimmer structures expand many fields inline;
- read-only household information and protocol inspection receive similar visual weight;
- Save/Delete are placed after the entire form;
- technical notes and raw values consume normal editing space.

The app already contains the right precedent in `ExpandableAdvancedSection` and Configure Dimmer: **human concepts first, technical representation available but secondary**.

## Scope

In scope:

- Light, Group, Scene, Sensor, Rule, Schedule, Plug, and Resource Link editors;
- Configure Dimmer;
- Advanced/Bridge and plug administration screens;
- shared rows, choices, disclosure, focused editing, touch geometry, save/delete placement, and editor feedback.

Out of scope:

- dashboard/tile redesign;
- Hue/TP-Link protocol or service behavior changes;
- new management capabilities;
- cloud, telemetry, new persistence, transactions, automatic repair, or workflow engines;
- a new UI/design-system dependency unless a concrete implementation blocker justifies it.

## Target UX

The ordinary editor should answer these questions in order:

1. **What is this?** — name and useful current state.
2. **What do I normally change?** — common controls and settings.
3. **What larger choice/structure can I open?** — membership, target, conditions/actions, timing, per-light state.
4. **Where are rare technical values?** — Details/Advanced.
5. **How do I save or remove it?** — clearly reachable Save/Create; destructive action separated and confirmed.

The goal is not “zero scrolling.” The goal is to remove **unnecessary default height**.

## Interaction rules

| Situation | Preferred treatment |
|---|---|
| boolean | switch or obvious state action |
| 2–4 choices | compact segmented/chip choice |
| many choices / resources | focused picker/list |
| membership | focused multi-select list |
| numeric continuum | slider + concise value |
| exact protocol value | Advanced/disclosure only when needed |
| repeatable structured item | summary row/card, edit one item at a time |
| common read-only state | compact value row |
| raw/technical metadata | Details/Advanced |
| destructive action | separated, confirmed action |

Focused pickers/editors may be implemented as a modal, navigation screen, or bounded inline disclosure. The implementation should choose the least complicated mechanism that is comfortable on the target phone. Avoid nested-modal machinery unless a real screen demonstrates that it is the simplest option.

## Save/Create policy

Save/Create must not be buried behind a long technical form. Acceptable solutions include:

- a persistent footer;
- a stack-header action;
- a short enough editor that the normal Save is immediately/reliably reachable.

Do not introduce fixed editor chrome solely to satisfy an architectural pattern.

Delete/removal remains separate and retains existing confirmation semantics.

## Touch target policy

New primary pressable controls should normally provide approximately 48dp touch geometry, consistent with Android guidance and the app's phone-only use. Do not turn this into a pixel-perfect certification exercise; the real criterion is comfortable, non-ambiguous use on the supported Pixel 9 Pro portrait target.

## Resource direction

| Surface | Default view | Secondary / Advanced |
|---|---|---|
| Light | name, power, brightness, common color/temp | behavior, exact color values, IDs/model/state |
| Group | name, power/state, light count, room class | membership picker, appearance, technical metadata |
| Scene | name, activate, membership/state summaries | edit one light state, exact values, owner/version |
| Sensor | name, useful status, Configure Dimmer when recognized | model/type/raw events/capabilities/references |
| Configure Dimmer | physical controls + human-readable action/target summaries | exact IDs/events/references/provenance |
| Rule | name, enabled state, condition/action summaries | edit one item, exact paths/technical preview |
| Schedule | name, enabled state, timing/action summaries | focused timing/command, recovery/technical details |
| Plug | alias, relay, useful readings | device/network metadata |
| Resource Link | name/description/class, linked-resource summary | exact paths/metadata |
| Advanced/Admin | grouped settings/action rows | capabilities/diagnostics/recovery details |

## Success test

The overhaul is successful when the two household users can open a representative item and reach the common edit in a few obvious taps, while unusual Hue detail remains available without dominating the screen.

Behavioral correctness remains governed by SRS/SAD 2.4.1 and the existing application/protocol tests.
