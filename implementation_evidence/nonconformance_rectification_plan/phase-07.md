# Phase 07 — Schedules Handoff

Status: `VERIFIED — LOCAL; TARGET ACCEPTANCE PENDING`

## Scope

Primary closure: `NC-HUE-007`.

Requirements: `HUE-009`, `HUE-016`, `FR-013`.

## Implemented evidence

- [ScheduleEditor](../../src/ui/editors/ScheduleEditor.tsx) exposes absolute, timer, recurring daily/weekly, and randomized pattern controls, weekday selection, a bounded randomization window, autodelete, descriptive metadata, read-only execution metadata, and typed target operations.
- [Schedule catalog serialization](../../src/protocol/hue/catalog/schedules.ts) and [resource handling](../../src/protocol/hue/resources/schedules.ts) convert structured patterns into Hue V1 fields and omit unchanged commands.
- Typed time-pattern validation rejects malformed clocks, dates, durations, weekday sets, and randomization windows. Daily and weekly patterns serialize to distinct Hue weekday masks; randomized patterns serialize their `A##:##:##` window.
- New Schedule POSTs also pass through the adapter serializer, so `timePattern` never reaches the bridge; it becomes `localtime`, `time`, `starttime`, and `recurring` as applicable. Sensor commands serialize to `/sensors/{id}/config` and pass automation policy.
- Arbitrary address/method/body entry is not exposed. [HueV1Adapter](../../src/protocol/hue/HueV1Adapter.ts) normalizes newly structured commands with the current credential only at dispatch; explicit rebuild is the only command-address recovery action.
- Existing unsupported command entries remain inspectable and can be disabled/deleted through the existing editor actions.

## Focused verification

- [Schedule/resource tests](../../test/protocol/hue/resources/resources.test.ts) cover pattern parsing and unchanged-command omission.
- [Catalog tests](../../test/protocol/hue/catalog/resourceCatalog.test.ts) cover boundary validation, daily/weekly/randomized serialization, typed target construction, supported-path validation, and credential redaction during rebuild.
- [Mutation-boundary tests](../../test/protocol/hue/catalog/mutationBoundary.test.ts) prove both Light and Sensor schedule commands reach credential-bound Hue endpoints.
- [Editor component coverage](../../test/ui/editors/managementEditors.test.tsx) checks pattern, weekday, randomization, and target controls.
- The focused regression suite additionally verifies rich existing command bodies survive ordinary saves, parsed credential metadata does not create a false command change, structured method/body violations are rejected at the catalog boundary, recurring timers retain recurrence, and malformed Schedule entries remain isolated and inspectable.
- Light/Group/Sensor command bodies now expose catalog-backed brightness, color, transition, and configuration fields; multi-field commands are represented as `set` rather than being mislabeled as `on`.
- Recurring-daily start dates are visible and retained through an ordinary editor save, and the exported Schedule update serializer emits an intentionally changed command exactly once.

## Disposition

Local structured schedule management and command authorization are verified. Disposable bridge schedule creation, disablement, explicit rebuild, and cleanup remain target acceptance.
