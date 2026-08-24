# Phase 06 — Legacy Resource Tile Visual Fidelity

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-05.md`
- `src/tabs/common/Button.tsx`
- `src/tabs/common/Style.ts`
- `screenshot1.png`, `screenshot2.png`, `screenshot3.png`

## Objective

Replace the generic rounded `ResourceTile` presentation with a modern React Native recreation of the established legacy `ItemButton` visual grammar while preserving the new generalized resource semantics.

## Why this phase exists

The current tile is 160x124 with rounded corners and Unicode `★`, `✎`, `⌫` action pills. The previous UI used compact square raised controls, image-based overlapping Favorite/Edit buttons, Solarized state maps, and the retained `questionMark.png` unknown overlay. Visual fidelity is a stakeholder requirement, not cosmetic polish.

## Authoritative requirements

- `FR-011` — PRIMARY
- `UX-VIS-001` — supporting/advanced; completed after screen integration in Phase 07
- `FR-007`, `FR-008`, `FR-009`, `FR-010`, `FR-016` — supporting semantics
- `QA-001` — supporting layout

## Relevant SAD sections

- `runtime_components` (`CMP-UI`)
- `supported_resource_semantics`
- 2.2.0 legacy tile visual decision
- `repository_structure`

## In scope

- Reimplement `ResourceTile` geometry and visual layers with current RN primitives.
- Use `useWindowDimensions()` or the SAD-selected responsive rule; do not use fixed 160px tile width.
- Recreate a visibly raised main button without adding the obsolete old button dependency.
- Use retained `assets/favorite.png`, `assets/edit.png`, and `assets/questionMark.png`.
- Favorite control overlaps lower-left; Edit control overlaps lower-right where applicable.
- Recreate Solarized-derived state presentation from the legacy reference:
  - On -> yellow family;
  - Off -> neutral/dark family;
  - Group indeterminate -> orange family;
  - known non-binary -> SAD-selected established neutral/accent treatment.
- Unknown/Missing uses full-tile semi-transparent question-mark image; no text-only `?` substitute as the primary visual.
- Preserve accessibility labels/roles and pending indication without destroying the visual grammar.
- Remove Unicode action glyph implementation from the shared tile component.

## Explicitly out of scope

- Removing the collection-screen Delete affordance until Phase 07, unless the component API can be cleaned without changing user access yet.
- Rebuilding every editor.
- Reintroducing `react-native-really-awesome-button`.
- Pixel visual sign-off; Phase 08.

## Expected repository changes

### Existing prerequisites

- `src/ui/components/ResourceTile.tsx`
- `assets/favorite.png`
- `assets/edit.png`
- `assets/questionMark.png`
- legacy reference files listed above

### Expected outputs

- rewritten `src/ui/components/ResourceTile.tsx`
- optional `src/ui/theme/legacyDashboard.ts` or equivalent centralized palette/geometry module
- expanded tests under `test/ui/resourceTile/`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-06.md`

## Required implementation behavior

- Main tile remains the primary action target.
- Corner action pressables must not accidentally trigger the main tile action.
- Favorite/Edit controls remain individually accessible.
- Unknown/Missing tile primary action remains disabled according to current resource semantics.
- Preserve title readability at supported Pixel display/font settings.

## Tests

- Known On/Off/indeterminate/non-binary render appropriate style tokens.
- Unknown renders the actual question-mark asset overlay.
- Favorite and Edit render image assets in the correct logical corners.
- Nested action presses do not invoke main `onPress`.
- No Unicode `★`, `☆`, `✎`, `⌫` action glyphs remain in `ResourceTile`.
- Responsive dimensions are derived from window width rather than the old fixed 160 width.

## Acceptance focus

- `AC-FR-011`
- `AC-UX-VIS-001` — **PARTIAL/ADVANCED**; complete after screen integration and Pixel review.

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/resourceTile test/ui/shell.test.tsx
npm run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-06.md` with rendered-test descriptions and any local screenshot artifacts.

## Exit criteria

- [ ] Shared tile reproduces the specified legacy visual grammar.
- [ ] Actual retained PNG assets are used for Favorite/Edit/Unknown.
- [ ] Main/corner action semantics remain correct.
- [ ] Local tile tests pass.
- [ ] Evidence is complete.
