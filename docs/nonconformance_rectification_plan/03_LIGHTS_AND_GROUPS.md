# Phase 03 — Lights and Groups

## Objective

Deliver complete, capability-aware light and group management on the phase 02 boundary.

## Ownership

- Primary closure: `NC-HUE-002`, `NC-HUE-003`
- Requirements: `HUE-004`, `HUE-005`, `FR-013`
- Supports: `HUE-020`, `REL-003`
- Dependencies: phases 01–02

## Light work

1. Display required identity, model/capability, reachable, and current-state fields.
2. Provide typed controls for supported V1 fields including on, brightness, hue, saturation, xy, color temperature, alert, effect, and transition behavior where the device advertises support.
3. Make read-only/unsupported fields visibly non-editable; do not render controls that imply unsupported capability.
4. Validate ranges and mutually constrained color inputs before mutation.

## Group work

1. Provide create/edit controls for name, light membership, group class/type where supported, and group actions.
2. Build valid create payloads and changed-only update payloads.
3. Represent aggregate/indeterminate group state without presenting it as a definite on/off value.
4. Refresh catalog data after successful creation or mutation without duplicating resources.

## Verification

- Component tests cover wrapping/layout, capability-dependent controls, read-only presentation, validation, and indeterminate group state.
- Service/adapter tests assert correct endpoints and exact payloads for create and changed-field update.
- Integration tests cover success, structured Hue error, timeout, and refresh.
- Run the common quality gate.

## Exit criteria

- Required light state and metadata are inspectable and all supported writable fields are safely editable.
- Groups can be created and edited with membership, class/type, and supported actions.
- `NC-HUE-002` and `NC-HUE-003` are closed with focused evidence.

