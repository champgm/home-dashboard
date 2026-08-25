# Phase 05 - Resource Tile Semantics Integration

Before implementation, read:

- `docs/legacy-awesome-button-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/legacy-awesome-button-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `src/ui/components/LegacyResourceButton.tsx`
- `src/ui/components/ResourceTile.tsx`
- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/screens/FavoritesScreen.tsx`
- `src/ui/screens/PlugsScreen.tsx`
- `99_PHASE_HANDOFF_TEMPLATE.md`

## Objective

Replace the current generic card-style `ResourceTile` rendering with the legacy AwesomeButton-based control while preserving all existing resource semantics and navigation behavior.

## Why this phase exists

The reusable visual component is already proven in Phase 04. This phase focuses only on translating current application state/callbacks into that component without simultaneously changing page/grid composition.

## Authoritative requirements

- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- QA-003
- UX-VIS-001

## Relevant SAD sections

- ApplicationService/resource semantics
- UI component isolation
- Favorite behavior
- state presentation

## In scope

- Adapt or replace `ResourceTile.tsx` so all existing callers render `LegacyResourceButton`.
- Map known binary state to On/Off palette.
- Map Unknown/missing state to the question-mark treatment and no unsafe primary toggle.
- Preserve Scene activation and nonbinary no-op semantics.
- Preserve Favorite add/remove behavior.
- Preserve Edit navigation.
- Remove dashboard-level `onDelete`/delete glyph handling. Deletion remains through editors/confirmation flows.
- For Plugs, keep physical alias as the displayed title when known and use the technical endpoint only as an unavailable pre-contact locator per existing requirements.
- Ensure subtitle/diagnostic metadata is not rendered inside the compact main dashboard tile unless 2.2.0 explicitly requires it.

## Explicitly out of scope

- Four-column grid/page composition.
- Changing primary tabs.
- Editor redesign.
- Protocol changes.

## Expected repository changes

Likely modifications:

- `src/ui/components/ResourceTile.tsx` (compatibility adapter or removal after caller migration)
- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/screens/FavoritesScreen.tsx`
- `src/ui/screens/PlugsScreen.tsx`
- relevant UI tests

Expected evidence:

- `implementation_evidence/legacy-awesome-button/phase-05.md`

## Required implementation behavior

Visual changes must not change which command is issued. Existing ApplicationService methods remain the source of resource semantics. Do not move Hue/TP-Link logic into the tile.

If the current `ResourceTile` API is retained as an adapter, it must not keep the old generic Pressable/card rendering path.

## Tests

- Existing Favorites, Light/Group, Scene, Rule/Schedule/Sensor, and Plug UI tests updated to assert correct callbacks through the new visual control.
- Test Unknown primary action suppression.
- Test Scene primary activation callback.
- Test absence of dashboard Delete affordance.
- Test Favorite and Edit callbacks separately.

## Acceptance focus

Advances:

- AC-FR-011
- AC-FR-013
- AC-QA-003
- AC-UX-VIS-001

## Commands/checks

```sh
npm run typecheck
npm run test:ci -- --runTestsByPath test/ui/LegacyResourceButton.test.tsx test/ui/ResourceCollectionScreen.test.tsx test/ui/FavoritesScreen.test.tsx test/ui/PlugsScreen.test.tsx
```

Use the repository's actual committed filenames if they differ; update this phase evidence with the exact commands used.

## Persisted implementation evidence

Create `implementation_evidence/legacy-awesome-button/phase-05.md`.

## Exit criteria

- [ ] Generic card rendering is no longer used by normal resource tiles.
- [ ] Resource command semantics are unchanged.
- [ ] No dashboard Delete control remains.
- [ ] Favorite/Edit callbacks work independently.
- [ ] UI/protocol isolation remains intact.
- [ ] Tests pass and evidence is persisted.
