# Implementation Status — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Phase status

| Phase | Status | Key result / blocker |
|---:|---|---|
| 01 | complete | Shared Solarized editor grammar, compact Light/Group/Plug flows, focused selectors, reachable Save, separated confirmation, and live-operation treatment implemented. |
| 02 | complete | Scene summaries/focused light editing, Sensor household-first detail, and Configure Dimmer one-binding-at-a-time editing implemented without changing dimmer commit paths. |
| 03 | complete | Rule/Schedule/Resource Link summary-driven editing implemented; raw Schedule snapshots are normalized before publication, unsupported timing has an explicit replacement flow, GroupScene type/owner metadata is re-derived on Scene-ID changes, and unsupported commands remain read-only. |
| 04 | complete | Advanced, Bridge, provisioning/reauthorization, Resource Link index, and plug administration now use grouped compact rows/actions; Bridge capability reads are reachable on the destination screen. |
| 05 | partial — target pass pending | Cleanup and all local gates pass. A representative Pixel 9 Pro interaction pass requires a configured representative device/fixture session and was not claimed from component tests alone. |

## Checks run

| Date/phase | Command or target check | Result / note |
|---|---|---|
| 2026-08-30 / baseline | `npm run typecheck` | PASS before implementation. |
| 2026-08-30 / baseline | `npm run test:ci` | PASS before implementation. |
| 2026-08-30 / implementation | focused editor and dimmer UI tests | PASS — 5 suites, 32 tests. |
| 2026-08-30 / implementation | `npm run typecheck` | PASS. |
| 2026-08-30 / final local gates | `npm run test:ci` | PASS — 54 suites, 272 tests. |
| 2026-08-30 / review remediation | focused Scene/Rule/Resource Link, dimmer, and Advanced/Bridge tests | PASS — 4 suites, 32 tests, including GroupScene/alphanumeric Scene IDs, raw Scene units, focused dimmer editing, and capability-read navigation. |
| 2026-08-30 / review remediation | `npm run typecheck` | PASS. |
| 2026-08-30 / review remediation | `npm run test:ci` | PASS — 55 suites, 276 tests. |
| 2026-08-30 / latest review remediation | focused Rule/Schedule/Configure Dimmer/editor-control tests | PASS — 3 suites, 35 tests, including GroupScene owner re-derivation, unsupported Schedule summaries, and on-demand exact-value entry. |
| 2026-08-30 / latest review remediation | `npm run typecheck` | PASS. |
| 2026-08-30 / latest review remediation | `npm run test:ci -- --silent` | PASS — 55 suites, 278 tests. |
| 2026-08-30 / schedule normalization remediation | focused Schedule/Sensor/ApplicationService/resource-parser tests | PASS — 4 suites, 31 tests, including raw snapshot normalization, idempotent structured commands, parser-retained unsupported timing, explicit unsupported-time replacement, and Sensor exact-value disclosure. |
| 2026-08-30 / schedule normalization remediation | `npm run test:ci -- --silent` | PASS — 56 suites, 283 tests. |
| 2026-08-30 / schedule normalization remediation | `npm run typecheck` | PASS. |
| 2026-08-30 / final local gates | `npm run check:docs` | PASS — 0 errors, 0 warnings across the repository documentation validators. |
| 2026-08-30 / final local gates | `npm run check:fixture-secrets` | PASS. |
| 2026-08-30 / final local gates | `python3 docs/detail_edit_ux_overhaul/validate_detail_edit_ux_plan.py` | PASS — 10 requirements, 6 acceptance criteria, 5 phases. |
| 2026-08-30 / final local gates | `git diff --check` | PASS. |
| 2026-08-30 / target readiness | `npm run dev:android:check` with host permissions | PASS — Android SDK, API 36 image, dedicated `Home_Dashboard_API_36` AVD, and `/dev/kvm` available; no connected device/household fixture session was present. |

## Acceptance criteria

| Criterion | Status | Evidence / note |
|---|---|---|
| `AC-UX-EDIT-001` | pass — local | All representative editors put identity/common status and common edits ahead of collapsed technical/raw sections; focused editor tests and source review cover the migrated screens. |
| `AC-UX-EDIT-002` | pass — local | Group member/class, Schedule target, Resource Link target, and dimmer target presentations preserve exact values, including normalized raw Schedule timing/commands and alphanumeric GroupScene IDs/paths with their explicit owning Group; labels are disambiguated and unavailable selected IDs are retained. |
| `AC-UX-EDIT-003` | pass — local | Scene, Rule, Schedule, and dimmer structures use parent summaries with one focused item/editor while existing Save/remote mutation boundaries remain intact; Scene summaries include raw Hue units and all supported state fields, exact numeric/color entry is on demand, unsupported commands are explicitly read-only, and unsupported timing is replaceable only through an explicit action. |
| `AC-UX-EDIT-004` | pending target | Controls/actions are sized with approximately 48dp minimum geometry and Save/Delete/live actions are separated in source; Pixel portrait tap/keyboard comfort still needs the representative device/fixture pass. |
| `AC-UX-EDIT-005` | pass — local | Full regression suite passes, including action policy, changed-field/command semantics, destructive confirmation, Unknown-resource, and dimmer suites. |
| `AC-UX-EDIT-006` | pending target | Advanced/admin grouping and dashboard non-refactoring are verified locally; representative Pixel visual/touch confirmation remains target-gated. |

## Deferred low-impact UX items

- Run the representative Pixel 9 Pro portrait pass when a configured representative device or fixture session is available, including keyboard/search, editor touch comfort, and dashboard visual continuity.

## Behavior/spec deviations

- None. Existing service calls, payload construction, capability/unknown guards, unsupported/custom handling, Schedule authorization recovery, dimmer preview/commit behavior, and destructive confirmation semantics were retained. The dashboard source was not changed.
