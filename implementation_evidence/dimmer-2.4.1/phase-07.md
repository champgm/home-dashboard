# Phase 07 — Household Dimmer Characterization and Catalog

- Status: `complete`
- Date: `2026-08-29`
- Commit/revision: working tree; no commit was created by this task

## Work completed

- Added developer-only `scripts/capture-hue-snapshot.mjs` tooling that performs one coherent read-only Hue v1 aggregate GET, sanitizes the result before writing, defaults to the local `hue_bridge_ip`/`hue_bridge_token` inputs, refuses accidental replacement, and can print a Sensor inventory for selecting the dimmer's starting Sensor ID.
- Added focused snapshot-capture tests for aggregate validation, authenticated-root request construction, credential/whitelist/owner/path redaction, Sensor discovery output, private file permissions, and overwrite protection. Local credential inputs and full snapshots are now explicitly gitignored.
- Added developer-only, read-only `scripts/capture-hue-dimmer-fixture.mjs` tooling, including deterministic household-metadata anonymization and resource minimization.
- The capture selects only exact Sensor/Rule/Schedule/Resource-Link/helper/target resources for one selected Sensor, traversing every exact root linked by selected Resource Links (including nested links) and then traversing the conditions/actions/commands inside linked Rules/Schedules, and sanitizes owner, credential, authorization fields, and `/api/<credential>` path segments.
- Added synthetic capture-selection/sanitization tests for differently identified linked helpers, linked Rule/Schedule payload references, nested Resource Links, nonzero Group Scene targets, minimization, and anonymization.
- Captured and committed sanitized fixtures for the physically exercised living-room `RWL020` and kitchen `ZGPSWITCH`. A later read-only household capture added the deployed Bedroom Dimmer 2 `RWL020` one-action Rule form with its deliberately retained missing Group references. The primary RWL020 fixture contains 1 Group, 4 Scenes, 2 Sensors, 13 Rules, 1 Schedule, and 1 Resource Link; the missing-target fixture contains 1 Sensor and 8 Rules; the ZGPSWITCH fixture contains 1 Group, 3 Scenes, 1 Sensor, and 4 Rules. Household names and unique IDs are deterministic placeholders; exact resource IDs and references needed for graph characterization are retained.
- Added the two evidence-derived production catalog entries. Recognition requires exact manufacturer/model/type metadata and the exact advertised event sequence; missing or changed capability evidence fails closed. The RWL020 absolute-action matcher accepts both captured helper-Sensor and exact two-condition/one-action On/Off forms, but no broader Rule shape.
- Characterized the deployed RWL020 Scene cycle as five existing direct Rule slots sharing event `1000` and one helper status Sensor. Each slot is a simple edit because changing it requires exactly one existing Rule update; the helper condition/action topology is matched exactly and the unchanged helper action is retained.
- Extended the Hue Rule resource catalog only with the characterized helper forms: Sensor `lastupdated`/`status` conditions and a bounded Sensor status action (`0..4`). Other Sensor-state Rule action bodies remain rejected.
- Added fixture-backed projection and ApplicationService mutation regressions. A Scene-cycle slot edit emits exactly one Rule update, preserves the companion helper action, and performs the normal authoritative refresh.

## Requirements addressed

- `HUE-021`, `HUE-022`, `HUE-007`, `HUE-008` — target-derived identity/event/action catalogs, exact association/projection, and direct one-Rule mutation coverage. Phase 08 still owns the app-UI live edit/restore acceptance sequence.
- `PRIV-002`, `SEC-002` — capture is read-only and output sanitization is tested.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-021` | PASS — PHASE 07 | sanitized household fixtures, exact production catalog matching, fixture-backed projection tests, and physical event observations below |
| `AC-HUE-022` | PASS — LOCAL / Phase 08 live edit pending | deployed forms project from the household fixtures; one RWL020 Scene-cycle slot is proven to issue one changed-field Rule update while preserving its helper action |
| `AC-HUE-007` | PASS — LOCAL / target pending | existing Sensor management tests |
| `AC-HUE-008` | PASS — LOCAL / target pending | existing Rule parser/policy tests |
| `AC-PRIV-002` | PASS — LOCAL / target pending | no cloud path added; capture has no output upload |
| `AC-SEC-002` | PASS — LOCAL | sanitization test and fixture secret scan |

## Tests and checks executed

| Command/check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | strict TypeScript check |
| `node --test test/scripts/captureHueDimmerFixture.test.mjs` | PASS | exact selection, linked-helper/linked-payload/nested-link traversal, and secret redaction |
| `node test/scripts/captureHueSnapshot.test.mjs` | PASS | 7 aggregate capture, sanitization, credential-safe diagnostics, discovery, and private-output tests |
| `npm run check:fixture-secrets` | PASS | retained characterization/evidence scan |
| `npm run test:ci` | PASS | full local Jest suite |
| `npm run check:docs` | PASS | 2.4.1/2.2.0/nonconformance validators: zero errors/warnings |
| `git diff --check` | PASS | no whitespace errors |
| regenerate both fixtures from ignored aggregate + `cmp` | PASS | anonymized fixture generation is deterministic |

## Files materially changed

- `.gitignore` — excludes local bridge inputs and `.local/` full snapshots.
- `scripts/capture-hue-snapshot.mjs` — coherent aggregate capture, sanitization, private local output, and Sensor inventory CLI.
- `test/scripts/captureHueSnapshot.test.mjs` — snapshot-capture and discovery regression tests.
- `scripts/capture-hue-dimmer-fixture.mjs` — read-only selection/sanitization/CLI harness.
- `test/scripts/captureHueDimmerFixture.test.mjs` — synthetic secret-bearing input, traversal, minimization, and anonymization tests.
- `test/fixtures/characterization/hue.household-rwl020.json` — minimized/anonymized live RWL020 graph fixture.
- `test/fixtures/characterization/hue.household-rwl020-simple-missing-target.json` — minimized/anonymized deployed one-action RWL020 and deleted-target evidence.
- `test/fixtures/characterization/hue.household-zgpswitch.json` — minimized/anonymized live ZGPSWITCH graph fixture.
- `src/protocol/hue/dimmer/modelCatalog.ts` — exact production identity/event and deployed Rule-shape entries.
- `src/protocol/hue/catalog/resourceCatalog.ts` — exact characterized helper-state Rule validation.
- `test/protocol/hue/catalog/resourceCatalog.test.ts` — helper-form allow/deny boundary regressions.
- `test/protocol/hue/dimmer/householdFixture.test.ts` — live-fixture projection, fail-closed recognition, and direct save regression.

## Diagnostics/observability evidence

- Failure paths exercised: missing selected Sensor, unrelated text/path, helper selection through Resource Links, linked Rule/Schedule payload traversal, nested-link traversal, and secret-bearing owner/path fields.
- Credential-sensitive data checked/redacted: `LIVE_USER`, API path credentials, owner/credential/authorization fields are absent from sanitized output.
- Useful user/developer diagnostic observed: CLI failure messages are generic and the script never prints the credential value.

## Physical control/gesture observations

- Living-room `RWL020`: On `1000/1001/1002/1003`; Brighter `2000/2001/2002/2003`; Dimmer `3000/3001/3002/3003`; Off `4000/4001/4002/4003`. Tap produced initial press then short release; hold produced initial press, held repeats, then long release.
- Kitchen `ZGPSWITCH`: large main button `34`; buttons 2, 3, and 4 produced `16`, `17`, and `18` respectively.
- The fixture and production mappings were created only after the operator physically exercised these controls while the read-only snapshot/state capture was running.

## Known limitations

- Phase 07 proves catalog recognition, projection, and the production service mutation payload locally. Phase 08 must still install/run the app, perform a safe binding edit through Configure Dimmer on the real bridge, physically verify it, and restore it through the app.
- Phase 08 two-phone portrait and complete baseline target acceptance remain open.

## Target-dependent checks not yet performed

- Phase 08 app-UI live edit/physical verification/restore and two-phone checks only.
- The supplied saved bridge address was stale (`192.168.1.x` while the host was on `192.168.2.x`). Local `_hue._tcp` mDNS discovery found the same BSB002 bridge on the current LAN. A credential-safe aggregate GET created ignored `.local/hue-snapshot.json` with mode `0600`: 21 Lights, 4 Groups, 88 Scenes, 14 Sensors, 77 Rules, 7 Schedules, and 5 Resource Links. A direct scan confirmed the credential is absent from the file.

## Deviations or discovered specification/design problems

- None. This is the explicit target-gated path required by the plan; no unverified production mapping was added.

## Handoff to next phase

- Preconditions now satisfied: production entries and sanitized target fixtures are present and all local gates pass.
- Outputs the next phase may rely on: exact RWL020/ZGPSWITCH identity/event mappings and the characterized existing-Rule forms.
- Important invariants/traps: Phase 08 must record the original live mapping and restore it through the app; no direct bridge mutation or automatic rollback substitutes for that procedure.

## Exit checklist

- [x] Read-only capture tooling exists.
- [x] Local focused tests and secret scan pass.
- [x] Sanitized actual-household fixtures are committed.
- [x] Production model/event catalog entries are derived from actual evidence.
- [x] Real control/gesture observations match the catalog.
- [x] Evidence is persisted here.
- [x] Remaining Phase 08 target gates are explicit; no implementation issue is silently deferred.
