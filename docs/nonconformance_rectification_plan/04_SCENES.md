# Phase 04 — Scenes

## Objective

Implement resource-specific GroupScene and LightScene creation, editing, inspection, and activation.

## Ownership

- Primary closure: `NC-HUE-004`
- Requirements: `HUE-006`, `FR-013`
- Supports: `HUE-020`, `REL-003`
- Dependencies: phases 01–03

## Work

1. Distinguish GroupScene and LightScene forms and expose only fields valid for the selected form.
2. Support name, group or light membership, recycle/locked/appdata fields as permitted, and per-light scene state editing where supported.
3. Validate referenced groups/lights and reject stale or incompatible membership before writes.
4. Route create, update, activation, and deletion through explicit adapter operations with correct V1 endpoints and changed-field payloads.
5. Refresh and reconcile scene state after successful mutations.

## Verification

- Form tests cover both scene kinds, capability-sensitive per-light controls, validation, and read-only fields.
- Payload tests cover create/update/activate/delete endpoints and omission of unchanged fields.
- Integration tests cover stale references, bridge errors, timeouts, and post-mutation refresh.
- Run the common quality gate.

## Exit criteria

- Both scene forms are fully manageable without raw JSON or arbitrary endpoint input.
- Activation semantics and per-light state persistence are proven.
- `NC-HUE-004` is closed with focused evidence.
