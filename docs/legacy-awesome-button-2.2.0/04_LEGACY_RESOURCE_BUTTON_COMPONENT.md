# Phase 04 - LegacyResourceButton Component

Before implementation, read:

- `docs/legacy-awesome-button-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/legacy-awesome-button-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `src/ui/legacy/legacyButtonGeometry.ts`
- `src/ui/legacy/legacyButtonPalette.ts`
- `src/ui/legacy/legacyButtonAssets.ts`
- `src/tabs/common/Button.tsx`
- `src/ui/components/ResourceTile.tsx`
- `99_PHASE_HANDOFF_TEMPLATE.md`

## Objective

Implement the production `LegacyResourceButton` compound control using the maintained AwesomeButton primitive for the main face, Favorite control, and Edit control.

## Why this phase exists

This is the core fidelity phase. It intentionally contains only the reusable compound control and its state mapping so screen/layout concerns do not inflate the active reasoning set.

## Authoritative requirements

- UX-VIS-001
- FR-011
- FR-013
- QA-003

## Relevant SAD sections

- LegacyResourceButton component architecture
- UI/protocol isolation
- state presentation

## In scope

Implement a component that reproduces the old compound control:

- Main AwesomeButton with fixed square dimensions and raised darker lower face.
- Large centered bold multiline title.
- On/Off/nonbinary state color mapping from the centralized legacy palette.
- Favorite AwesomeButton overlapping lower-left, using `assets/favorite.png`.
- Edit AwesomeButton overlapping lower-right, using `assets/edit.png` and blue palette.
- Favorite active state uses yellow palette.
- Unknown state uses the retained large semitransparent `assets/questionMark.png` overlay and is not represented as Off.
- Light resources may include the retained translucent `assets/lightBulb.png` treatment if required by the 2.2.0 visual contract.
- Independent accessibility labels/hit targets for primary, Favorite, and Edit controls.
- Optional hiding of Favorite/Edit mini-buttons for utility/read-only cases, matching legacy semantics.
- No Delete button.

The component must accept application callbacks/state as props and must not import Hue/TP-Link adapters.

## Explicitly out of scope

- Replacing resource screens.
- Navigation/tab styling.
- Protocol commands.
- Editor changes except test fixtures/stubs.

## Expected repository changes

Expected outputs:

- `src/ui/components/LegacyResourceButton.tsx`
- tests such as `test/ui/LegacyResourceButton.test.tsx`
- optional test fixtures under `test/ui/fixtures/`
- `implementation_evidence/legacy-awesome-button/phase-04.md`

`src/ui/components/ResourceTile.tsx` may remain unchanged until Phase 05.

## Required implementation behavior

- Use `@rcaferati/react-native-awesome-button`; do not recreate the 3D face with generic Pressables.
- Primary callback and mini-control callbacks must not propagate into one another.
- Unknown primary state must remain disabled where FR-012 requires no primary command.
- Do not use Unicode star/pencil/delete glyphs.
- Preserve press/release animation for mini buttons as well as the main button.

## Tests

Component tests must cover:

- On, Off, Unknown, nonbinary visual variants;
- Favorite inactive/active;
- Edit visibility;
- hidden mini-button cases;
- callback isolation;
- accessibility labels;
- question-mark asset presence for Unknown;
- absence of any Delete affordance.

## Acceptance focus

Advances materially:

- AC-UX-VIS-001
- AC-FR-011
- AC-FR-013
- AC-QA-003

## Commands/checks

```sh
npm run typecheck
npm run test:ci -- --runTestsByPath test/ui/LegacyResourceButton.test.tsx
```

## Persisted implementation evidence

Create `implementation_evidence/legacy-awesome-button/phase-04.md`.

## Exit criteria

- [ ] Main/Favorite/Edit controls all use AwesomeButton.
- [ ] Legacy assets are used rather than Unicode substitutes.
- [ ] Unknown treatment matches FR-011.
- [ ] Delete is absent.
- [ ] Tests pass.
- [ ] Evidence is persisted.
