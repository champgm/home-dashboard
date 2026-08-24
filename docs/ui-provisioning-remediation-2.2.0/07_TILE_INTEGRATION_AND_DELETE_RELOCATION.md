# Phase 07 — Tile Integration and Delete Relocation

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-06.md`

## Objective

Integrate the legacy-style tile consistently across Favorites/Hue resources/plugs and remove destructive Delete from the normal dashboard tile while preserving full delete capability in the editor/administration workflow with existing confirmation semantics.

## Why this phase exists

The old tile had primary, Favorite, and Edit controls but no destructive inline Delete. The current `ResourceCollectionScreen` passes `onDelete` to every resource tile, while the generic `EditorForm` currently lacks delete. Visual fidelity must not accidentally remove required management capability.

## Authoritative requirements

- `UX-VIS-001` — PRIMARY
- `UX-DEL-001` — PRIMARY
- `UX-DEL-002` — PRIMARY
- `UX-DEL-003` — PRIMARY
- `FR-013`, `FR-014`, `FR-015` — supporting
- `FR-007` — supporting

## Relevant SAD sections

- `supported_resource_semantics`
- `runtime_components` (`CMP-UI`)
- deletion/confirmation architecture selected by 2.2.0
- `repository_structure`

## In scope

- Update `ResourceCollectionScreen`, `FavoritesScreen`, and `PlugsScreen` to use the shared legacy-style tile intentionally.
- Remove dashboard-tile delete control/prop from normal resource collections.
- Add Delete to existing-resource Hue editors using `ConfirmDestructiveAction`, `destructiveActionSpec`, and `performConfirmedHueDelete` or the exact 2.2.0-selected path.
- Ensure create/new editor mode has no Delete.
- Keep plug endpoint removal in its administration/editor flow and confirmation contract; do not add inline tile deletion.
- Verify Favorites/Editors still route correctly from the overlapping corner buttons.
- Audit all eight primary tabs for consistent tile usage where a resource tile exists.

## Explicitly out of scope

- Redesigning editor fields.
- Changing destructive semantics or remote recovery policy.
- Changing Favorite identity rules.
- Final Pixel visual sign-off.

## Expected repository changes

### Existing prerequisites

- `src/ui/components/ResourceTile.tsx`
- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/screens/FavoritesScreen.tsx`
- `src/ui/screens/PlugsScreen.tsx`
- `src/ui/editors/EditorForm.tsx`
- `src/ui/components/ConfirmDestructiveAction.tsx`
- `src/app/destructiveActions.ts`

### Expected outputs

- dashboard screens without inline Delete glyph/control
- editor delete action/confirmation for existing Hue resources
- integration tests under `test/ui/resourceCollections/` and `test/ui/editors/delete/`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-07.md`

## Required implementation behavior

- Opening an editor does not mutate or delete.
- Pressing Delete in editor opens confirmation only.
- Confirm is required for the remote delete.
- Cancel performs no delete.
- Normal dashboard tile shows only the controls authorized by `UX-VIS-001`.
- The edit corner control navigates without firing the primary tile action.
- Missing Favorite remains removable and non-actionable.

## Tests

- Resource collection tile contains main/Favorite/Edit but no Delete.
- Existing Hue editor exposes Delete; create editor does not.
- Confirmation tests cover open/cancel/confirm and no early DELETE.
- Favorites tile routes/toggles as expected.
- Plug tile has no inline Delete; endpoint administration still removes with confirmation.

## Acceptance focus

- `AC-UX-VIS-001` — local completion; Pixel visual confirmation remains Phase 08.
- `AC-UX-DEL-001`
- `AC-UX-DEL-002`
- `AC-UX-DEL-003`

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/resourceTile test/ui/resourceCollections test/ui/editors test/app/destructive.test.ts
npm run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-07.md`.

## Exit criteria

- [ ] No normal dashboard tile exposes destructive Delete.
- [ ] Existing Hue resources remain deletable from editor with explicit confirmation.
- [ ] Plug removal remains available in administration with confirmation.
- [ ] Legacy-style tile is consistently integrated.
- [ ] Tests pass and evidence is complete.
