# Phase 02 - AwesomeButton Compatibility Spike

Before implementation, read:

- `docs/legacy-awesome-button-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/legacy-awesome-button-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `src/tabs/common/Button.tsx`
- `package.json`
- `99_PHASE_HANDOFF_TEMPLATE.md`

## Objective

Prove that the maintained `@rcaferati/react-native-awesome-button` package works on Expo 57 / React Native 0.86.2 and renders/animates correctly on a Pixel 9 Pro before production integration begins.

## Why this phase exists

The old app depended on deprecated `react-native-really-awesome-button@2.0.4`. The maintained successor advertises React Native >=0.76 support and still exposes the required 3D face/darker-face/press-animation props, but actual target compatibility must be demonstrated before the SAD-selected architecture is relied upon.

## Authoritative requirements

- UX-VIS-001
- QA-001
- QA-003

## Relevant SAD sections

- selected UI component architecture
- dependency constraints
- target/runtime environment
- verification architecture

## In scope

- Install `@rcaferati/react-native-awesome-button` using npm and commit the resulting lockfile change.
- Create a temporary or test-only `AwesomeButtonSpike` screen/component exercising:
  - fixed width/height;
  - `backgroundColor`;
  - `backgroundActive`;
  - `backgroundDarker`;
  - `textColor`;
  - `raiseLevel`;
  - spring release behavior;
  - custom `Image` child;
  - independent press callback.
- Confirm the app builds and launches on a Pixel 9 Pro.
- Capture at least one resting screenshot and a short screen recording or equivalent observed evidence of press/release animation.
- Record the exact installed package version in evidence.

## Explicitly out of scope

- Replacing `ResourceTile`.
- Reproducing final legacy geometry.
- Creating a custom button clone.
- Changing resource screens.

## Expected repository changes

Existing inputs:

- `package.json`
- `package-lock.json`

Expected outputs:

- dependency changes in `package.json` and `package-lock.json`
- `src/ui/dev/AwesomeButtonSpike.tsx` or an equivalent clearly temporary/test-only location
- spike tests under `test/ui/`
- `implementation_evidence/legacy-awesome-button/phase-02.md`

## Required implementation behavior

The spike must use the package directly rather than wrapping it in final application abstractions. If Android build/runtime, press animation, fixed geometry, or image-child behavior fails materially, stop the plan and flag a SAD revision. Do not proceed with a custom imitation.

Do not install the deprecated `react-native-really-awesome-button` package.

## Tests

- Typecheck.
- Jest render/callback smoke test.
- Android target build/run.
- Manual target confirmation that the face visibly depresses and returns with the expected 3D lower layer.

## Acceptance focus

Advances:

- AC-UX-VIS-001
- AC-QA-001
- AC-QA-003

Does not complete them.

## Commands/checks

```sh
npm install @rcaferati/react-native-awesome-button
npm run typecheck
npm run test:ci -- --runTestsByPath test/ui/AwesomeButtonSpike.test.tsx
npm run android
```

If the exact test filename differs, use the committed filename; do not leave the command stale in evidence.

## Persisted implementation evidence

Create `implementation_evidence/legacy-awesome-button/phase-02.md` including target device result and installed package version.

## Exit criteria

- [ ] Maintained package is installed and locked.
- [ ] Android build launches on Pixel 9 Pro.
- [ ] 3D face and release animation are visibly functional.
- [ ] Fixed-size and custom-image content work.
- [ ] No SAD incompatibility remains unresolved.
- [ ] Evidence is persisted.
