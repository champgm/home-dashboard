# Phase 07 — Household Dimmer Characterization and Catalog

- Status: `target-gated-pending`
- Date: `2026-08-27`
- Commit/revision: working tree; no commit was created by this task

## Work completed

- Added developer-only, read-only `scripts/capture-hue-dimmer-fixture.mjs` tooling.
- The capture selects only exact Sensor/Rule/Schedule/Resource-Link/helper/target resources for one selected Sensor, traversing every exact root linked by selected Resource Links (including nested links) and then traversing the conditions/actions/commands inside linked Rules/Schedules, and sanitizes owner, credential, authorization fields, and `/api/<credential>` path segments.
- Added synthetic capture-selection/sanitization tests for differently identified linked helpers, linked Rule/Schedule payload references, and nested Resource Links. The production model catalog was intentionally left empty because no household bridge or dimmer fixture is available.

## Requirements addressed

- `HUE-021`, `HUE-022`, `HUE-007`, `HUE-008` — local capture/projection prerequisites only; actual target acceptance remains open.
- `PRIV-002`, `SEC-002` — capture is read-only and output sanitization is tested.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-021` | BLOCKED — TARGET | capture tooling is local; no actual household fixture/catalog/event observation exists |
| `AC-HUE-022` | BLOCKED — TARGET | synthetic edit paths pass; deployed action forms and physical verification are unavailable |
| `AC-HUE-007` | PASS — LOCAL / target pending | existing Sensor management tests |
| `AC-HUE-008` | PASS — LOCAL / target pending | existing Rule parser/policy tests |
| `AC-PRIV-002` | PASS — LOCAL / target pending | no cloud path added; capture has no output upload |
| `AC-SEC-002` | PASS — LOCAL | sanitization test and fixture secret scan |

## Tests and checks executed

| Command/check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | strict TypeScript check |
| `node --test test/scripts/captureHueDimmerFixture.test.mjs` | PASS | exact selection, linked-helper/linked-payload/nested-link traversal, and secret redaction |
| `npm run check:fixture-secrets` | PASS | retained characterization/evidence scan |
| `npm run test:ci` | PASS | full local Jest suite |

## Files materially changed

- `scripts/capture-hue-dimmer-fixture.mjs` — read-only selection/sanitization/CLI harness.
- `test/scripts/captureHueDimmerFixture.test.mjs` — synthetic secret-bearing input tests.

## Diagnostics/observability evidence

- Failure paths exercised: missing selected Sensor, unrelated text/path, helper selection through Resource Links, linked Rule/Schedule payload traversal, nested-link traversal, and secret-bearing owner/path fields.
- Credential-sensitive data checked/redacted: `LIVE_USER`, API path credentials, owner/credential/authorization fields are absent from sanitized output.
- Useful user/developer diagnostic observed: CLI failure messages are generic and the script never prints the credential value.

## Known limitations

- `test/fixtures/characterization/hue.household-dimmer.json` was not created because no actual household capture was available.
- `test/protocol/hue/dimmer/householdFixture.test.ts` and a production catalog entry are intentionally deferred rather than fabricated.

## Target-dependent checks not yet performed

- Connect to the configured permanent bridge, select the deployed dimmer Sensor, capture read-only data, run the secret scan on the resulting fixture, observe every physical control/gesture, derive only the observed catalog entry, and run the fixture-backed projector test.

## Deviations or discovered specification/design problems

- None. This is the explicit target-gated path required by the plan; no unverified production mapping was added.

## Handoff to next phase

- Preconditions now satisfied: capture tooling and sanitizer are ready for a target operator.
- Outputs the next phase may rely on: only a sanitized target fixture and evidence-derived catalog entry may be promoted to production.
- Important invariants/traps: capture remains read-only; ambiguity in physical identity/event mapping must stop characterization.
- Do **not** assume: synthetic `Acme/DIM-1` data is the household model.

## Exit checklist

- [x] Read-only capture tooling exists.
- [x] Local focused tests and secret scan pass.
- [ ] A sanitized actual-household fixture is committed.
- [ ] Production model/event catalog entry is derived from actual evidence.
- [ ] Real control/gesture observations match the catalog.
- [x] Evidence is persisted here.
- [x] The target gate is explicit; no implementation issue is silently deferred.
