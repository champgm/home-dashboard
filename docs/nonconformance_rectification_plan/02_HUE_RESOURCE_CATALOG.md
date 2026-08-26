# Phase 02 — Hue Resource Catalog and Mutation Boundary

## Objective

Establish the shared typed contract that every Hue resource editor uses for display, validation, serialization, and safe updates.

## Ownership

- Primary closure: `NC-HUE-001`, `NC-HUE-008`
- Requirements: `FR-013`, `HUE-020`
- Supports: `HUE-004`, `HUE-005`, `HUE-006`, `HUE-007`, `HUE-008`, `HUE-009`, `REL-003`
- Dependencies: phase 01

## Work

1. Define a `HueV1ResourceCatalog` (or equivalent) with resource type, field path, value type, enum/range constraints, capability predicate, read-only/writable status, create/update applicability, and target endpoint.
2. Cover lights, groups, scenes, sensors, rules, schedules, resource links, and configuration fields required by the SRS/SAD. Preserve unknown fields for read-only inspection without making them generically writable.
3. Validate at the service/adapter mutation boundary so UI bypass cannot submit an invalid or undeclared write.
4. Implement nested changed-field serializers. Updates send only changed writable fields; create commands send only required and explicitly supplied supported fields.
5. Correct Resource Link updates so omitted/unchanged fields are not resent.
6. Keep bridge address, application key, and other credentials out of editable payloads, logs, diagnostics, and exported artifacts.

## Prohibited design

- No raw JSON editor or arbitrary path/endpoint input.
- No generic write-through API accepting unvalidated property bags.
- No Hue cloud dependency.

## Verification

- Catalog completeness tests cover every managed resource and required field class.
- Boundary tests reject unknown, read-only, out-of-range, wrong-type, and wrong-endpoint writes.
- Serialization tests prove unchanged nested fields are omitted and supported falsy values are retained.
- Resource Link tests prove changed-field-only behavior.
- Run the common quality gate.

## Exit criteria

- All Hue editors can consume one catalog contract; later phases need only resource-specific controls and workflows.
- No mutation route bypasses catalog validation/serialization.
- `NC-HUE-001` and `NC-HUE-008` are closed with tests and reviewed safety evidence.

