# Phase 05 — Sensors and Search

## Objective

Make sensor state/configuration safely manageable and implement the required Hue discovery lifecycle without persistent UI noise.

## Ownership

- Primary closure: `NC-HUE-005`, `NC-HUE-009`
- Requirements: `HUE-007`, `HUE-015`, `FR-013`
- Supports: `HUE-016`, `HUE-020`, `REL-003`
- Dependencies: phases 01–02

## Sensor work

1. Display sensor type, model, unique ID, capabilities, reachable state, battery, current state/configuration, and recent events where available.
2. Route state and configuration fields to their correct Hue V1 subpaths; never treat read-only state as configurable.
3. Add model/type-specific configuration controls and creation forms only for fields declared writable by the catalog.
4. Validate required type-specific fields, ranges, references, and bridge-supported capabilities.
5. Preserve enough event and identity information for phase 06 to inspect and repair dimmer bindings.

## Search work

1. Model search as an explicit typed operation with starting, active, completed, failed, and timed-out states.
2. Show concise feedback when the user initiates search and actionable result/error feedback when it finishes.
3. Poll only while a user-initiated search is active and the app is foregrounded; stop on completion, timeout, navigation disposal, or backgrounding.
4. Do not persist a passive “recent search” banner after the operation is no longer relevant.

## Verification

- Sensor tests cover supported and unsupported types, read-only fields, correct subpaths, validation, creation, and changed-only updates.
- Search lifecycle tests use controlled time and app lifecycle events to prove polling starts/stops correctly and never survives backgrounding.
- UI tests prove explicit results are accessible and the passive recent-search line is absent.
- Run the common quality gate.

## Exit criteria

- Supported sensor configuration and creation are available through typed controls; unsupported/read-only attributes are inspectable without a false edit affordance.
- Search feedback and polling satisfy the complete lifecycle.
- `NC-HUE-005` and `NC-HUE-009` are closed with focused evidence.

