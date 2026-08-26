# Phase 06 — Rules and Dimmer Bindings

## Objective

Provide structured rule management and a safe workflow to diagnose and repair misconfigured dimmer-switch bindings.

## Ownership

- Primary closure: `NC-HUE-006`
- Requirements: `HUE-008`, `HUE-016`, `FR-013`
- Supports: `HUE-020`, `REL-003`
- Dependencies: phases 01–05

## Work

1. Render rule name, owner/status, last-triggered/times-triggered data, conditions, actions, and referenced resources.
2. Add structured condition builders for supported address/operator/value combinations and structured action builders for supported target/method/body combinations.
3. Resolve sensor, group, light, and scene references into human-readable labels while retaining exact resource IDs.
4. Add reverse-reference inspection from a sensor/dimmer to the rules and schedules that consume its events.
5. Provide a repair workflow that can compare an invalid binding with current sensor events/resources, validate replacements, preview the exact changes, and save changed fields only.
6. Permit inspection, disablement, and deletion of existing dangerous automations. A broken automation must not be re-enabled until all references and actions validate.
7. Keep all editing catalog-driven; do not expose a raw condition/action JSON editor.

## Verification

- Parser/presenter tests cover valid, unknown, stale, and malformed condition/action structures without crashing or discarding inspectable data.
- Builder tests cover model-specific dimmer events, address construction, validation, preview, save, disable, and delete.
- Integration tests prove a misconfigured binding can be identified and repaired using disposable rules.
- Negative tests prove invalid references cannot be enabled or submitted.
- Run the common quality gate.

## Exit criteria

- Rules can be created and edited through structured controls.
- A user can inspect and safely repair a dimmer binding without direct sensor-state mutation or raw JSON.
- Existing dangerous automations remain inspectable and can be disabled/deleted.
- `NC-HUE-006` is closed with focused evidence.

