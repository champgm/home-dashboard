# Phase 06 — Sensor Editor Household Usability

- Status: `complete`
- Date: `2026-08-27`
- Commit/revision: working tree; no commit was created by this task

## Work completed

- Reorganized `SensorEditor` into concise editable/household details plus collapsed Advanced inspection.
- Kept writable Sensor configuration catalog fields and existing Sensor CRUD behavior; state and raw capabilities remain read-only.
- Added prominent Configure Dimmer access for recognized catalog members and replaced serialized-substring automation discovery with exact parsed Rule/Schedule/Resource-Link references.
- Added human-readable reachability, battery, model, software, and event-reporting presentation.

## Requirements addressed

- `HUE-007` — Sensor management and supported configuration remain available.
- `HUE-021` — recognized Sensor access to the physical Configure Dimmer workflow and Advanced boundary.
- `FR-013`, `QA-001`, `QA-003` — editor usability, scroll surface, and protocol/UI isolation.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-007` | PASS — LOCAL | management editor regression suite |
| `AC-HUE-021` | PASS — LOCAL SYNTHETIC / target pending | SensorEditor usability and exact-reference tests |
| `AC-FR-013` | PASS — LOCAL | resource catalog editor tests |
| `AC-QA-001` | PASS — LOCAL LAYOUT / Pixel pending | existing safe-area shell and ScrollView tests |
| `AC-QA-003` | PASS — LOCAL | UI/protocol seams remain injectable |

## Tests and checks executed

| Command/check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | strict TypeScript check |
| `npm test -- --runInBand test/ui/editors/SensorEditorUsability.test.tsx test/ui/editors/managementEditors.test.tsx test/protocol/hue/resources/resources.test.ts test/protocol/hue/search/searchLifecycle.test.ts` | PASS | ordinary Sensor regression plus exact references |
| `npm run test:ci` | PASS | full local regression suite |

## Files materially changed

- `src/ui/editors/SensorEditor.tsx` — normal/Advanced information boundary and Configure Dimmer action.
- `test/ui/editors/SensorEditorUsability.test.tsx` — false-positive reference and household presentation coverage.

## Diagnostics/observability evidence

- Failure paths exercised: missing fields, unsupported dimmer catalog, and absent exact Sensor references.
- Credential-sensitive data checked/redacted: Advanced paths come from the redacting reference parser; normal surface renders no raw path/event.
- Useful user/developer diagnostic observed: normal reference count is based on exact structural references, so text mentioning a Sensor path is ignored.

## Known limitations

- Target-specific physical layout and actual household catalog recognition remain open.

## Target-dependent checks not yet performed

- Pixel portrait navigation and the actual household Sensor/dimmer editor were not available.

## Deviations or discovered specification/design problems

- None. No direct Sensor state/buttonevent write control was added.

## Handoff to next phase

- Preconditions now satisfied: generic Sensor usability and exact reference behavior are locally covered.
- Outputs the next phase may rely on: actual capture tooling can feed the same snapshot/projector boundary without UI changes.
- Important invariants/traps: state/buttonevent remains inspection-only; exact references, not serialized text, determine association.
- Do **not** assume: the synthetic catalog or fixture reflects the deployed household dimmer.

## Exit checklist

- [x] Required implementation exists.
- [x] Required focused tests pass.
- [x] Typecheck/required checks pass.
- [x] Evidence is persisted here.
- [x] No unresolved implementation issue is silently deferred.
- [x] Later-phase work was not pulled forward without justification.
