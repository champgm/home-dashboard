# Phase 17 — Navigation, Favorites, and Shared Resource UI

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 02, Phase 15, Phase 16

## Objective

Implement React Navigation 7 scrollable/swipeable top tabs, the Advanced entry point, heterogeneous Favorites, shared resource-tile state rendering, and Missing/Unknown behavior.

## Why this phase exists

All resource-specific screens need common navigation, tile semantics, and Favorites plumbing. This phase avoids carrying individual editor models.

## Authoritative requirements

- `FR-005` (**PRIMARY OWNER**) — The primary navigation shall provide Favorites, Lights, Groups, Scenes, Sensors, Rules, Schedules, and Plugs as horizontally scrollable top-level destinations and shall permit horizontal swipe navigation between destinations.
- `FR-006` (**PRIMARY OWNER**) — Bridge Configuration/Capabilities, Resource Links, Hue provisioning/reauthorization, and plug endpoint administration shall be accessible from an Advanced/Bridge area rather than requiring fixed-width primary tabs.
- `FR-007` (**PRIMARY OWNER**) — Favorites shall support heterogeneous entries referencing supported Hue resources and TP-Link plugs for which a meaningful dashboard presentation exists.
- `FR-010` (**PRIMARY OWNER**) — A normal tap on a resource that has neither a Scene activation action nor an applicable binary state shall issue no device/bridge command.
- `FR-015` (**PRIMARY OWNER**) — If a Favorite references a resource or plug endpoint that no longer resolves, the Favorite shall be shown as missing/unknown, shall issue no primary command, and shall remain removable by the user.
- `FR-011` (supporting) — A resource whose current state is unknown shall display the established full-tile semi-transparent question-mark indication and shall not be represented as Off.
- `FR-012` (supporting) — A binary-state primary tap shall not be issued from an unknown state because the opposite state cannot be determined safely; explicit absolute actions may remain available in an editor where applicable.
- `QA-001` (supporting) — Primary navigation, Favorites, common toggles, Scene activation, editors, confirmation dialogs, and Advanced/Bridge shall be operable on both supported Pixel 9 Pro phones in portrait orientation without layout clipping that hides required controls.

## Relevant SAD sections

- `SAD_2.0.0.yaml:selected_platform.navigation`
- `SAD_2.0.0.yaml:supported_resource_semantics.favorites`
- `SAD_2.0.0.yaml:repository_structure.root`
- `SAD_2.0.0.yaml:runtime_components`

## In scope

- Install React Navigation 7 native/material-top-tabs dependencies and Expo-compatible pager/screen dependencies.
- Create top tabs in required order: Favorites, Lights, Groups, Scenes, Sensors, Rules, Schedules, Plugs.
- Enable scrollable tab bar and horizontal swipe.
- Create Advanced/Bridge route outside fixed-width primary tabs.
- Implement shared tile shell for Known/Unknown/Pending and the full-tile semi-transparent question-mark Unknown visual.
- Implement heterogeneous Favorite add/remove/resolve against AppConfig and current state.
- Missing Favorite remains removable and issues no primary command.
- Non-actionable tile tap does nothing.

## Explicitly out of scope

- Resource-specific editors
- Delete confirmation
- Provisioning screens

## Expected repository changes

### Existing prerequisite files/directories

- src/ui/
- src/app/DeviceStateStore.ts
- src/storage/ConfigStore.ts
- `implementation_evidence/phase-02.md` (output of Phase 02)
- `implementation_evidence/phase-15.md` (output of Phase 15)
- `implementation_evidence/phase-16.md` (output of Phase 16)

### Expected outputs created or materially modified by this phase

- package.json
- package-lock.json
- src/ui/navigation/
- src/ui/components/ResourceTile.tsx
- src/ui/favorites/
- src/ui/screens/placeholderTabs/
- test/ui/navigation/
- test/ui/favorites/
- implementation_evidence/phase-17.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Do not add bottom-tab/hamburger replacement for the required resource destinations.
- Unknown is not rendered as Off.
- Favorites store references, not copied device names/states.
- Same-ID Favorite continuity mitigation is intentionally not added.

## Tests

- Scrollable top-tab order and swipe configuration.
- Unknown question-mark visual and primary tap suppression.
- Heterogeneous Favorite resolution across Hue + plug refs.
- Missing Favorite remains visible/removable.
- Component tests with protocol adapters fully mocked.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-17.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-005` — On a Pixel 9 Pro portrait display, verify all destinations are reachable by horizontal tab scrolling and swipe navigation without clipping required controls.
- `AC-FR-006` — Verify each listed function is reachable from Advanced/Bridge and Resource Links are not required to occupy a fixed primary tab.
- `AC-FR-007` — Create Favorites containing at least one Hue Light, Group, Scene, Sensor/automation resource, and plug; verify each renders according to its resource semantics.
- `AC-FR-010` — Tap read-only/non-binary resource tiles and verify the protocol adapters receive no mutation call.
- `AC-FR-011` — Force timeout/malformed-response states and verify the full-tile translucent question-mark treatment appears while Off styling does not.
- `AC-FR-012` — Mark a binary resource Unknown, tap its primary tile, and verify no toggle is sent; where an editor provides explicit On/Off, verify those absolute actions remain distinguishable.
- `AC-FR-015` — Delete/remove the target externally, refresh, verify the Favorite becomes Missing/Unknown, emits no command on tap, and can be manually removed.
- `AC-QA-001` — Run visual/end-to-end layout tests on both phones at supported font/display settings and verify all required controls remain reachable.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm install @react-navigation/native@^7 @react-navigation/native-stack@^7 @react-navigation/material-top-tabs@^7
npx expo install react-native-screens react-native-safe-area-context react-native-pager-view
npm run typecheck
npm run lint
npm run test:ci -- test/ui/navigation test/ui/favorites
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-17.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

At minimum record:

- work completed;
- primary/supporting requirement IDs;
- tests/checks and actual results;
- acceptance criteria exercised;
- materially changed files;
- known limitations;
- target-dependent checks not yet performed;
- deviations or discovered SRS/SAD problems;
- handoff notes.

## Exit criteria

- [ ] Every in-scope implementation item exists and follows the listed SAD sections.
- [ ] All non-target-gated tests/checks required by this phase pass.
- [ ] Every target-gated item is either passed with evidence or explicitly recorded `PENDING TARGET` where this phase permits deferral.
- [ ] `implementation_evidence/phase-17.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
