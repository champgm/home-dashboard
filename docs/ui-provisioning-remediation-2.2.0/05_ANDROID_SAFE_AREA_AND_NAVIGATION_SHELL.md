# Phase 05 — Android Safe Area and Navigation Shell

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-01.md`

## Objective

Ensure the Dashboard top-tab strip and required content begin below Android system status/cutout insets on the supported Pixel 9 Pro phones without double-insetting native-stack screens.

## Why this phase exists

The active Dashboard stack hides the native header and currently renders `MaterialTopTabNavigator` directly under the Android status bar. `react-native-safe-area-context` is already installed but is not used by the active UI root/navigation shell.

## Authoritative requirements

- `QA-001` — PRIMARY
- `FR-005` — supporting
- `FR-001` — supporting

## Relevant SAD sections

- `runtime_components` (`CMP-UI`)
- `architecture_overview`
- `selected_platform`
- `repository_structure`
- 2.2.0 safe-area/navigation decision

## In scope

- Add `SafeAreaProvider` at the appropriate active app root.
- Apply the top system inset to the Dashboard/tab surface selected by SAD 2.2.0.
- Ensure native-stack screens that already own their headers are not double-padded.
- Preserve horizontal scrolling/swipe navigation.
- Add deterministic component/navigation tests using mocked safe-area insets.

## Explicitly out of scope

- Redesigning tab colors/labels.
- Tile appearance.
- General editor layout overhaul.
- iOS/web support expansion.

## Expected repository changes

### Existing prerequisites

- `src/ui/App.tsx`
- `src/ui/navigation/AppNavigation.tsx`
- `src/ui/components/Screen.tsx`
- `test/ui/shell.test.tsx`
- dependency `react-native-safe-area-context` already present

### Expected outputs

- active safe-area provider/inset integration
- expanded shell/navigation tests
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-05.md`

## Required implementation behavior

- Top tab bar must not render under the status bar.
- Do not hard-code Pixel status-bar pixel heights.
- Do not resurrect `Constants.statusBarHeight` as the primary mechanism.
- Stack screens with native headers must not gain a second top inset.
- The boot view should remain visually sane under system insets.

## Tests

- Mock a non-zero top inset and verify Dashboard applies it once.
- Verify a stack child screen does not receive duplicate inset from Dashboard wrapper.
- Existing navigation/tab behavior remains intact.

### Target-gated verification

On both supported Pixel 9 Pro phones in portrait, capture a screenshot showing the clock/battery/status area and the complete top tab strip with no overlap. May remain `PENDING TARGET` until Phase 08.

## Acceptance focus

- `AC-QA-001` — local slice here; physical Pixel completion in Phase 08.

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/shell.test.tsx
npm run doctor
npm run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-05.md`.

## Exit criteria

- [ ] Safe-area provider/inset architecture matches SAD 2.2.0.
- [ ] Dashboard top inset is applied once.
- [ ] Local UI tests pass.
- [ ] Pixel check is passed or explicitly `PENDING TARGET` for Phase 08.
- [ ] Evidence is complete.
