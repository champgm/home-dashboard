# Phase 06 - Dense Dashboard Grid Integration

Before implementation, read:

- `docs/legacy-awesome-button-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/legacy-awesome-button-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `src/tabs/Lights.tsx`
- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/screens/FavoritesScreen.tsx`
- `src/ui/screens/PlugsScreen.tsx`
- `src/ui/navigation/AppNavigation.tsx`
- `99_PHASE_HANDOFF_TEMPLATE.md`

## Objective

Make normal configured dashboard destinations visually behave as the dense legacy tile dashboard rather than a generic page with large title/toolbars and loose card spacing.

## Why this phase exists

Button fidelity alone is insufficient if the page still presents the control inside the modern form-like composition. This phase handles only layout/composition after tile semantics are stable.

## Authoritative requirements

- FR-005
- QA-001
- UX-VIS-002

## Relevant SAD sections

- navigation architecture
- dashboard composition
- safe-area layout

## In scope

- Use compact wrapping resource grids driven by the Phase 03 geometry helper.
- On supported Pixel 9 Pro portrait, reproduce the legacy approximately-four-column density unless the authoritative 2.2.0 contract defines a more precise fit rule.
- Remove the oversized resource-page heading from normal configured grid presentation where it is not part of the 2.2.0 visual contract.
- Remove generic Material-blue `Refresh`/`Advanced` toolbar buttons from the normal tile grid. Keep required actions accessible through the architecture-approved navigation/Advanced surface.
- Where a resource-specific utility action belongs in the grid (for example Light/Sensor search), render it using the same legacy AwesomeButton primitive with Favorite/Edit hidden, matching the legacy "Scan for new lights" control language.
- Preserve the already-correct Android safe-area behavior; do not regress the top tab bar beneath the system status bar.
- Ensure the horizontally scrollable primary tabs still function.

## Explicitly out of scope

- Redesigning tab icons/typography unless 2.2.0 explicitly added that requirement.
- Hue provisioning card behavior while unconfigured.
- Advanced/Bridge page redesign.
- Protocol changes.

## Expected repository changes

Likely modifications:

- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/screens/FavoritesScreen.tsx`
- `src/ui/screens/PlugsScreen.tsx`
- `src/ui/screens/LightsScreen.tsx`
- `src/ui/screens/SensorsScreen.tsx` if search is rendered as a grid utility tile
- shared grid/layout helper under `src/ui/legacy/`
- UI tests

Expected evidence:

- `implementation_evidence/legacy-awesome-button/phase-06.md`

## Required implementation behavior

Do not hard-code a 160px tile width. Use the legacy geometry helper/window width so the supported Pixel portrait layout remains dense. Ensure mini Favorite/Edit controls do not collide with adjacent tiles; vertical spacing must include their overlap depth.

Do not restore large generic toolbar buttons merely because an existing test expects them; update tests to the 2.2.0 contract.

## Tests

- Render dense grids with representative 1, 4, 5, 20, and 216 resource counts.
- Verify no clipping of mini controls.
- Verify safe-area/tab layout remains below the Android status bar in target screenshots.
- Verify horizontal primary tab navigation still works.
- Verify search utility tile invokes the existing search callback without Favorite/Edit affordances.

## Acceptance focus

Advances materially:

- AC-FR-005
- AC-QA-001
- AC-UX-VIS-002

## Commands/checks

```sh
npm run typecheck
npm run test:ci
```

Run the full UI suite because this phase changes shared screen composition.

## Persisted implementation evidence

Create `implementation_evidence/legacy-awesome-button/phase-06.md` and attach/cite Pixel screenshots produced during target verification.

## Exit criteria

- [ ] Configured resource screens use compact wrapping tile grids.
- [ ] Generic 160px card layout is gone.
- [ ] Generic Refresh/Advanced toolbar buttons no longer dominate normal grids.
- [ ] Search utility action uses the legacy button primitive where applicable.
- [ ] Status-bar safe area remains correct.
- [ ] Tests pass and evidence is persisted.
