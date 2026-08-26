# Phase 07 — Schedules

## Objective

Implement structured Hue schedule management, including time patterns and command construction.

## Ownership

- Primary closure: `NC-HUE-007`
- Requirements: `HUE-009`, `FR-013`
- Supports: `HUE-016`, `HUE-020`, `REL-003`
- Dependencies: phases 01–06

## Work

1. Display status, local time, created/start times, recurrence/randomization, autodelete, command, and execution/error metadata where available.
2. Add typed controls for supported absolute, recurring, timer, and randomized Hue V1 time patterns.
3. Build commands from catalog-approved resource operations; do not permit arbitrary URL, method, body, or credential entry.
4. Treat changes that Hue cannot safely patch as an explicit previewed rebuild operation, never as an implicit delete/recreate.
5. Permit inspection, disablement, and deletion of existing dangerous schedules even when their command cannot be represented for editing.

## Verification

- Time parser/formatter tests cover supported patterns, boundary values, time zones where applicable, and invalid input.
- Command-builder tests prove only approved endpoints and payloads are emitted and credentials are absent.
- Integration tests cover create, patch, explicit rebuild, disable, delete, bridge error, and refresh.
- Run the common quality gate.

## Exit criteria

- Supported schedule patterns and commands are safely createable/editable through structured controls.
- Unsupported existing schedules remain inspectable and can be disabled/deleted.
- `NC-HUE-007` is closed with focused evidence.

