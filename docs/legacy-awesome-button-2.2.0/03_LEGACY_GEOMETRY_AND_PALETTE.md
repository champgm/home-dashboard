# Phase 03 - Legacy Geometry and Palette Extraction

Before implementation, read:

- `docs/legacy-awesome-button-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/legacy-awesome-button-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `src/tabs/common/Button.tsx`
- `src/tabs/common/Style.ts`
- `src/tabs/Lights.tsx`
- `assets/edit.png`
- `assets/favorite.png`
- `assets/questionMark.png`
- `assets/lightBulb.png`
- `99_PHASE_HANDOFF_TEMPLATE.md`

## Objective

Create deterministic modern constants/helpers that encode the legacy ItemButton geometry and Solarized button-role palette without coupling runtime UI to the obsolete `src/tabs` application tree.

## Why this phase exists

The old appearance came from both AwesomeButton and very specific geometry/color-role choices. Those values should be captured once before the final compatibility wrapper is implemented.

## Authoritative requirements

- UX-VIS-001
- UX-VIS-002
- FR-011
- QA-003

## Relevant SAD sections

- LegacyResourceButton architecture
- repository/package structure
- UI isolation

## In scope

Create a small legacy visual module under `src/ui/legacy/` containing:

- geometry helper using the old formulas as the initial contract:
  - outer margin = window width * 0.01;
  - main button dimension = window width * 0.20;
  - mini button dimension = main dimension / 3;
  - legacy overlap offsets translated from `Button.tsx`;
- Solarized button-role maps for:
  - normal/off gray;
  - on/yellow;
  - edit/blue;
  - Favorite active/yellow;
- explicit role names: face, active face/overlay, darker lower face, text;
- asset references for Edit, Favorite, Unknown question mark, and Light bulb.

Prefer committed literal color constants or a tiny local deterministic helper. Do not add a runtime dependency solely to reproduce colors unless the 2.2.0 SAD explicitly requires it.

## Explicitly out of scope

- Rendering the production tile.
- Resource semantics.
- Screen/grid replacement.
- Changing old source files.

## Expected repository changes

Expected outputs:

- `src/ui/legacy/legacyButtonGeometry.ts`
- `src/ui/legacy/legacyButtonPalette.ts`
- `src/ui/legacy/legacyButtonAssets.ts`
- unit tests under `test/ui/legacy/`
- `implementation_evidence/legacy-awesome-button/phase-03.md`

## Required implementation behavior

The values must be traceable to the old `ItemButton` source. Avoid arbitrary magic numbers that differ from the reference without documentation. If a small adjustment is required because the maintained package measures height differently, keep the old value as the reference and record the adjustment and rationale in evidence.

## Tests

- Pure geometry tests for representative Pixel portrait width.
- Assert mini-button size and overlap calculations.
- Palette-role tests ensure On/Off/Edit/Favorite states map to distinct expected color roles.
- Asset module smoke test.

## Acceptance focus

Advances:

- AC-UX-VIS-001
- AC-UX-VIS-002
- AC-FR-011

## Commands/checks

```sh
npm run typecheck
npm run test:ci -- --runTestsByPath test/ui/legacy/legacyButtonGeometry.test.ts test/ui/legacy/legacyButtonPalette.test.ts
```

## Persisted implementation evidence

Create `implementation_evidence/legacy-awesome-button/phase-03.md`.

## Exit criteria

- [ ] Legacy geometry is encoded in one reusable helper.
- [ ] Solarized button-role mappings are centralized.
- [ ] No production component yet duplicates these constants.
- [ ] Unit tests pass.
- [ ] Evidence is persisted.
