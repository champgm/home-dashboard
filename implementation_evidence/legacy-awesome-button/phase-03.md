# Phase 03 Handoff

## Phase

- Phase number/name: 03 - Legacy Geometry and Palette Extraction
- Commit/revision: Working tree implementation
- Date: 2026-08-24

## Work completed

- Added pure legacy geometry helpers for the approximately 20%-window tile, 1% outer margin, one-third mini controls, and legacy overlap offsets.
- Centralized explicit face, active-face, darker-face, and text palette roles for Off, On, indeterminate, known, Edit, and Favorite states.
- Centralized Edit, Favorite, Unknown, and Light bulb bitmap asset references.
- Kept the existing theme module as a compatibility export over the new visual modules.

## Requirements addressed

- UX-VIS-001, UX-VIS-002, FR-011, QA-003

## Acceptance criteria advanced/completed

- AC-UX-VIS-001, AC-UX-VIS-002, and AC-FR-011 advanced with deterministic unit coverage.

## Files materially changed

- `src/ui/legacy/legacyButtonGeometry.ts`
- `src/ui/legacy/legacyButtonPalette.ts`
- `src/ui/legacy/legacyButtonAssets.ts`
- `src/ui/theme/legacyDashboard.ts`
- `test/ui/legacy/legacyButtonGeometry.test.ts`
- `test/ui/legacy/legacyButtonPalette.test.ts`
- `test/ui/legacy/legacyButtonAssets.test.ts`

## Commands/tests executed

| Command/check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript clean. |
| `npm run test:ci -- --runTestsByPath test/ui/legacy/legacyButtonGeometry.test.ts test/ui/legacy/legacyButtonPalette.test.ts test/ui/legacy/legacyButtonAssets.test.ts` | PASS | Geometry, role mapping, and asset smoke tests pass. |

## Target-device evidence

- Device/build: Not available.
- Screenshot paths: None.
- Screen recording/animation evidence: None.
- Target-gated checks completed: None.
- Target-gated checks remaining: Pixel spacing and visual comparison in Phase 07.

## Known limitations

- Integer tile sizing and a minimum four-density-safe margin preserve the existing modern helper behavior while remaining derived from the legacy ratios; target screenshots still need to confirm final spacing.

## Deviations

- None.

## Discovered specification/design problems

- None.

## Handoff notes

- What the next phase can assume: Production UI should consume these modules rather than duplicate geometry or color literals.
- What it must not assume: The constants alone do not prove package animation or target layout.
- Temporary files/components that still need removal: None.
