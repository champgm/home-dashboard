# Legacy AwesomeButton Visual-Fidelity Implementation Plan

## Authority

This change plan is subordinate to the authoritative Home Dashboard SRS and SAD.

- Current authority at plan start: `docs/SRS_2.1.0.yaml` and `docs/SAD_2.1.0.yaml`.
- Phase 01 must create and approve `docs/SRS_2.2.0.yaml` and `docs/SAD_2.2.0.yaml` before implementation work continues.
- The SRS defines required user-visible outcomes.
- The SAD defines the selected implementation architecture.
- This plan defines only implementation order, deliverables, verification, and handoff boundaries.

If a phase discovers that the requested legacy visual behavior cannot be represented without changing the SRS, stop and revise the SRS. If the selected AwesomeButton architecture is incompatible with Expo 57 / React Native 0.86.2 on the target Pixel 9 Pro, stop after Phase 02 and revise the SAD before implementing a fallback. Do not silently replace the selected component with a hand-built clone.

## Repository-root conventions

All paths in this plan are relative to the Home Dashboard repository root.

Existing visual references that must be treated as inputs:

- `src/tabs/common/Button.tsx` - legacy `ItemButton` implementation.
- `src/tabs/common/Style.ts` - legacy Solarized-derived color roles.
- `src/tabs/Lights.tsx` - legacy dense wrapping-grid layout and search tile.
- `assets/edit.png`
- `assets/favorite.png`
- `assets/questionMark.png`
- `assets/lightBulb.png`
- `screenshot1.png`, `screenshot2.png`, `screenshot3.png` - historical visual references already in the repository.

Current implementation inputs:

- `src/ui/components/ResourceTile.tsx`
- `src/ui/screens/ResourceCollectionScreen.tsx`
- `src/ui/screens/FavoritesScreen.tsx`
- `src/ui/screens/PlugsScreen.tsx`
- `src/ui/navigation/AppNavigation.tsx`
- `package.json`

## Execution rules

1. Execute phases sequentially.
2. Before each phase, read the shared plan files plus the authoritative SRS/SAD version named in that phase.
3. Keep the legacy implementation source in place as a reference until final acceptance. Do not delete `src/tabs/common/Button.tsx` during this change plan.
4. Preserve existing resource semantics. This plan changes visual rendering and layout, not Hue/TP-Link command behavior.
5. Do not add delete controls back onto normal dashboard tiles. Destructive actions remain editor/modal flows.
6. Do not approximate the old 3D interaction using generic `Pressable`, `elevation`, or shadow styling if the selected AwesomeButton package passes the compatibility gate.
7. Do not introduce a second button abstraction after the compatibility wrapper exists. All normal dashboard resource tiles must use the same wrapper.
8. No phase may claim visual acceptance from Jest snapshots alone. Final acceptance requires target-device screenshots and observed press/release animation on a Pixel 9 Pro.

## Selected package gate

The selected successor to the deprecated legacy package is:

`@rcaferati/react-native-awesome-button`

Phase 02 must prove it on the real stack before integration. The package is expected to provide the legacy concepts needed by the wrapper: fixed width/height, `backgroundColor`, `backgroundActive`, `backgroundDarker`, `textColor`, `raiseLevel`, spring release animation, custom React Native children, and press callbacks.

If Phase 02 fails on the target stack, record the failure in `implementation_evidence/legacy-awesome-button/phase-02.md`, stop, and flag a SAD revision. Do not proceed by inventing a custom 3D button implementation inside a later phase.

## Testing expectations

Each phase must add tests with the implementation rather than deferring all work to the final phase.

At minimum:

- TypeScript compilation remains clean.
- Jest tests cover rendering and callback semantics without live Hue/TP-Link devices.
- The selected library is exercised on the Android target before the wrapper is committed as the production primitive.
- Visual acceptance compares target screenshots against the legacy screenshots and source geometry.
- Accessibility labels and independent hit targets for primary, Favorite, and Edit controls are retained.

## Evidence

Every phase must create or update:

`implementation_evidence/legacy-awesome-button/phase-XX.md`

using `99_PHASE_HANDOFF_TEMPLATE.md`.

Evidence must record commands, results, screenshots or screenshot paths where applicable, requirements/acceptance criteria advanced, files changed, and unresolved target-gated work.

## No scope creep

Explicitly out of scope for this plan:

- Hue provisioning protocol repair.
- Hue/TP-Link diagnostics redesign.
- Safe-area/status-bar remediation except regression checks that the already-correct layout remains correct.
- Hue/TP-Link protocol behavior.
- Editor redesign beyond removal of dashboard-level delete affordances if still present.
- Bridge configuration/default seeding.
- New themes unrelated to the legacy Solarized dashboard visual contract.

## Completion protocol

A phase is complete only when its implementation exists, required tests pass, evidence is persisted, and no issue is silently deferred.

The complete change is accepted only after Phase 07 produces side-by-side target screenshots and verifies that the maintained AwesomeButton primitive reproduces the characteristic raised/pressed/released interaction closely enough to be recognizably the same dashboard control language as the legacy app.
