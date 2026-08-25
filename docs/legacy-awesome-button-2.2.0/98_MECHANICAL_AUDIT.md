# Mechanical Audit

## Plan inventory

Expected implementation phases: 7.

Shared files:

- `00_IMPLEMENTATION_PLAN.md`
- `00_REQUIREMENT_PHASE_MAP.md`
- `98_MECHANICAL_AUDIT.md`
- `99_PHASE_HANDOFF_TEMPLATE.md`

Phase files:

1. `01_AUTHORITATIVE_VISUAL_CONTRACT.md`
2. `02_AWESOME_BUTTON_COMPATIBILITY_SPIKE.md`
3. `03_LEGACY_GEOMETRY_AND_PALETTE.md`
4. `04_LEGACY_RESOURCE_BUTTON_COMPONENT.md`
5. `05_RESOURCE_TILE_SEMANTICS_INTEGRATION.md`
6. `06_DENSE_DASHBOARD_GRID_INTEGRATION.md`
7. `07_PIXEL_VISUAL_AND_INTERACTION_ACCEPTANCE.md`

## Checks performed before delivery

- Every phase begins with explicit prerequisite paths.
- Phase 01 references current 2.1.0 authority; phases 02-07 reference future Phase-01 outputs 2.2.0.
- Every current source prerequisite exists in the provided repository.
- Every future file is identified as a Phase-01 or earlier-phase output before later use.
- No phase installs the deprecated `react-native-really-awesome-button` package.
- The package-install command uses `npm install @rcaferati/react-native-awesome-button`.
- Commands refer only to repository npm scripts that currently exist, except test-file-specific paths which phases are instructed to keep synchronized with actual committed filenames.
- Protocol/provisioning/diagnostics changes are explicitly out of scope.
- No phase calls for a custom 3D clone unless a future SAD revision authorizes one after Phase-02 incompatibility evidence.
- New SRS requirement IDs are introduced only in Phase 01 and are not claimed to exist in 2.1.0.
- Acceptance ownership includes all requirements materially changed by this focused plan.
- Phase sizes were reviewed for LLM context pressure; package spike, geometry/palette, component rendering, semantics integration, layout, and target acceptance are deliberately separated.

## Target-gated work

- Phase 02: Pixel 9 Pro compatibility/animation spike.
- Phase 06: Pixel screenshot/layout verification is useful but may remain partial until Phase 07.
- Phase 07: Pixel 9 Pro configured-dashboard visual and kinetic acceptance is mandatory.

## Known external dependency fact used by the plan

The maintained package repository documents `@rcaferati/react-native-awesome-button` as the current package and advertises peer support for React Native >=0.76. The Home Dashboard repository uses React Native 0.86.2. Actual target compatibility remains a Phase-02 proof obligation.
