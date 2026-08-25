# Phase 07 - Pixel Visual and Interaction Acceptance

Before implementation, read:

- `docs/legacy-awesome-button-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/legacy-awesome-button-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `src/tabs/common/Button.tsx`
- `src/tabs/Lights.tsx`
- `screenshot1.png`
- `screenshot2.png`
- `screenshot3.png`
- `99_PHASE_HANDOFF_TEMPLATE.md`

## Objective

Perform target-device acceptance of the completed legacy AwesomeButton visual restoration and close every acceptance criterion owned by this change plan.

## Why this phase exists

The required behavior is partly visual and kinetic. Unit tests cannot prove that the maintained button feels like the old raised/animated component or that the dense grid resembles the established dashboard on a Pixel 9 Pro.

## Authoritative requirements

- FR-005
- FR-011
- FR-013
- QA-001
- QA-003
- UX-VIS-001
- UX-VIS-002

## Relevant SAD sections

- LegacyResourceButton architecture
- dashboard layout/navigation
- verification architecture

## In scope

On a Pixel 9 Pro with representative configured resources:

- Capture a configured Lights-screen screenshot with enough resources to demonstrate the dense grid.
- Compare side by side with the historical Lights screenshot(s).
- Verify the main resource button visibly has a front face and darker lower 3D face.
- Press and release main, Favorite, and Edit controls and verify the characteristic depression/release animation is present on all three.
- Verify On and Off states use the intended legacy Solarized role mappings.
- Force an Unknown/unreachable state and verify the large semitransparent question-mark asset covers the tile without being represented as Off.
- Verify Favorite active/inactive appearance.
- Verify Edit uses the retained blue button and pencil bitmap.
- Verify no Unicode star/pencil/delete substitutes remain in normal tiles.
- Verify no dashboard Delete affordance exists.
- Verify four-column-equivalent dense portrait composition and no overlap/clipping.
- Verify the primary tab bar remains below Android system status UI.
- Verify Scene/nonbinary/Favorite/Plug tiles preserve their existing command semantics.
- Run the full automated suite after target adjustments.

## Explicitly out of scope

- Pixel-perfect reproduction of Android system fonts/status bar.
- Reopening Hue provisioning/diagnostic defects.
- Replacing the selected package because of subjective minor differences; any material mismatch must be documented and traced to the 2.2.0 acceptance criteria.

## Expected repository changes

Potential minor visual tuning only in already-created legacy UI modules/screens.

Expected outputs:

- target screenshots under `implementation_evidence/legacy-awesome-button/screenshots/`
- optional short screen recording path/reference in evidence
- `implementation_evidence/legacy-awesome-button/phase-07.md`
- `implementation_evidence/legacy-awesome-button/final-status.md`

## Required implementation behavior

Do not declare success solely because the package is technically present. The visual result must be recognizably the legacy Home Dashboard button language shown by the old source/screenshots.

If the maintained package passes functionality but cannot reproduce a mandatory 2.2.0 visual/interaction criterion, stop and flag a SAD revision rather than silently accepting a custom approximation.

## Tests

- Full Jest suite.
- Typecheck.
- Expo doctor.
- Target-device visual/interaction checks above.
- Accessibility smoke check for the three independent controls.

## Acceptance focus

Complete:

- AC-FR-005
- AC-FR-011
- AC-FR-013
- AC-QA-001
- AC-QA-003
- AC-UX-VIS-001
- AC-UX-VIS-002

## Commands/checks

```sh
npm run typecheck
npm run test:ci
npm run doctor
npm run android
```

## Persisted implementation evidence

Create `implementation_evidence/legacy-awesome-button/phase-07.md` and `implementation_evidence/legacy-awesome-button/final-status.md`.

The final status file must list each acceptance criterion above as PASS/BLOCKED with evidence paths.

## Exit criteria

- [ ] All automated tests pass.
- [ ] Pixel 9 Pro target screenshots are persisted.
- [ ] Main/Favorite/Edit buttons exhibit 3D press/release animation.
- [ ] Legacy assets and state colors are visually confirmed.
- [ ] Dense grid is recognizably equivalent to the old dashboard composition.
- [ ] Unknown question-mark treatment is confirmed.
- [ ] Status bar does not cover primary tabs.
- [ ] Every listed acceptance criterion is PASS, or implementation is explicitly blocked for SRS/SAD revision.
- [ ] Final evidence is persisted.
