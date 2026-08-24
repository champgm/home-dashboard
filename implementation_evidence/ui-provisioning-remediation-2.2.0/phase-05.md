# Phase 05 — Android Safe Area and Navigation Shell

## Phase

- Phase: `05 — Android Safe Area and Navigation Shell`
- Status: `COMPLETE`
- Commit/revision: `f1940d6` plus working-tree remediation changes
- Date: `2026-08-23`

## Work completed

- Added `SafeAreaProvider` at the active application root.
- Added a Dashboard-only `useSafeAreaInsets().top` surface wrapper around the material top tabs.
- Kept native-stack child screens outside that Dashboard wrapper so native headers do not receive duplicate top padding.
- Kept horizontal tab scrolling/swipe behavior unchanged.
- Added mocked-inset component tests and sane boot-view top inset handling.

## Requirement IDs addressed

### Primary

- `QA-001`

### Supporting

- `FR-005`, `FR-001`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-QA-001` | PARTIAL | `test/ui/safeArea/navigationShell.test.tsx` proves one top inset and no child double inset; Pixel screenshot remains Phase 08 |

## Tests and checks executed

```text
npm run typecheck — PASS.
npm run test:ci -- test/ui/safeArea test/ui/shell.test.tsx — PASS (2 suites, 3 tests).
```

## Files materially changed

- `src/ui/App.tsx`
- `src/ui/navigation/AppNavigation.tsx`
- `test/ui/safeArea/navigationShell.test.tsx`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-05.md`

## Diagnostics / observability evidence

- Failure mode exercised: mocked non-zero Android top inset and native-stack child containment.
- User-visible output: Dashboard tabs receive the system top inset; boot view also avoids status-bar overlap.
- Technical detail retained: inset is read from `react-native-safe-area-context`, not a hard-coded Pixel height.
- Sensitive-data/redaction result: not applicable; no diagnostics or network data changed.

## Visual evidence, if applicable

- Reference: Android status-bar/safe-area contract in `docs/SRS_2.2.0.yaml` / `docs/SAD_2.2.0.yaml`.
- New artifact: deterministic mocked-inset tests.
- Result: local inset architecture passes; physical Pixel screenshot remains target-gated.

## Known limitations

- Physical Pixel 9 Pro portrait verification is pending Phase 08.

## Target-dependent checks not yet performed

- `PENDING TARGET`: screenshots on both supported Pixel 9 Pro phones.

## Deviations or discovered specification problems

- None.

## Scope check

- [x] No bridge-switch/multi-bridge behavior added.
- [x] No durable operation journals added.
- [x] No cloud/remote diagnostics added.
- [x] No obsolete legacy UI runtime imported into the active app.
- [x] No later-phase work pulled forward without justification.

## Handoff notes

- What now exists: `SafeAreaProvider` root and `DashboardSurface` top-inset boundary.
- Files/interfaces next phase should rely on: `DashboardSurface` for tab-surface layout; do not add another top safe-area wrapper to stack screens.
- Pending target-gated work: physical safe-area review moves to Phase 08.
