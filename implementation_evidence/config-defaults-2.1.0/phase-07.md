# Configuration Defaults Change — Phase Handoff

## Phase

- Phase: `07 — Upgrade, Reset, Two-Phone, and Target Acceptance`
- Status: `COMPLETE` (local implementation complete; target checks pending)
- Commit/revision: working tree
- Date: `2026-08-23`

## Work completed

- Completed the A→B automated update simulation and full regression suite.
- Bumped the release metadata to app/package `2.1.0`, Android `versionCode: 20100`, retaining package `com.zhna123.homedashboard.v2`.
- Produced a successful local Android Expo export in `dist`.
- Added final traceability for the revised requirements and acceptance criteria.

## Requirement IDs addressed

### Primary

- `CON-005`, `HUE-001`, `HUE-012`, `TPL-002`, `TPL-009`, `DATA-001`, `DATA-002`, `DATA-003`, `DATA-005`

### Supporting

- `SEC-001`, `CON-002`, `CON-010`, `TPL-010`, `PRIV-001`, `PRIV-002`, `PRIV-004`, `HUE-017` reset portion.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-CON-005` | PASS | phone-local AsyncStorage design; no sync path in code/docs |
| `AC-HUE-001` | PASS | resolver/ConfigStore A/B bridge tests and effective bridge UI path |
| `AC-TPL-002` | PASS | endpoint validation and stable-ID upsert tests |
| `AC-TPL-009` | PASS | automated A→B test: untouched/edited/removed/new/user-added plugs |
| `AC-DATA-001` | PASS | concurrent mutation and restart/persistence tests |
| `AC-DATA-002` | PASS | A→B default update simulation |
| `AC-DATA-003` | PASS | corrupt/unsupported state and explicit reset tests |
| `AC-DATA-005` | PASS | read/write and migration-write failure tests |
| `AC-HUE-017` reset portion | PASS | protected binding remains a separate store; reset path never accesses it |
| Signed in-place APK update | PENDING TARGET | EAS credentials/network and physical target not available in this run |

## Tests and checks executed

```text
npm run typecheck
PASS
npm run lint
PASS
npm run test:ci
17 suites, 61 tests passed
npm run check:fixture-secrets
Characterization fixture secret scan passed.
python3 docs/validate_home_dashboard_docs_2.1.0.py
errors=0 (one warning: characterization archive not colocated)
npx expo config --type public
PASS; version 2.1.0, package com.zhna123.homedashboard.v2, versionCode 20100
npm run export:android
PASS; Exported: dist
git diff --check
PASS
npm run doctor
21/21 checks passed. No issues detected.
```

## Files materially changed

- Release metadata: `app.json`, `package.json`, `package-lock.json`.
- Runtime/config/schema/tests and 2.1 documents listed in earlier phase handoffs.

## Configuration-generation evidence

- Bundled-default generations used: A and B.
- Persisted schema version(s): v1 and v2.
- Migration fixture(s): `test/storage/configSchema.test.ts`, `test/storage/ConfigStore.test.ts`.
- Override/removal cases: bridge override, P1 untouched, P2 edited, P3 removed, P4 new, U1 added, Favorites/settings retained.

## Diagnostics / privacy evidence

- Corruption/I/O failure exercised: yes, including failed migration write.
- User-visible diagnostic: existing ConfigError/StorageError shell and explicit reset.
- Sensitive-data check: `npm run check:fixture-secrets` passed; HueBinding remains SecureStore-only.

## Known limitations

- No signed EAS APK was produced in this run.
- No in-place install/update was run on a Pixel, and no live Hue bridge or TP-Link hardware was exercised.
- The bundled Hue bridge IPv4 remains unset because the repository did not supply that deployment address.

## Target-dependent checks not yet performed

- `PENDING TARGET`: `npm run build`/signed APK artifact and SHA-256.
- `PENDING TARGET`: 2.0→2.1 in-place update on a Pixel.
- `PENDING TARGET`: two-phone independence, WAN-disabled LAN control, live bridge identity mismatch, and physical plug alias/control.

## Deviations or discovered specification problems

- None. Target-gated release checks are explicitly pending; no SRS/SAD issue was found.

## Scope check

- [x] No bridge switching/replacement behavior was introduced.
- [x] No cloud configuration synchronization was introduced.
- [x] Protected HueBinding semantics were not weakened.
- [x] Explicitly removed bundled plugs cannot be resurrected by update.
- [x] No arbitrary new defaultable fields were introduced outside SRS/SAD 2.1.0.

## Handoff notes for next phase

- Run `npm run doctor` and `npm run build` in a networked release environment, then perform the target-gated in-place update matrix before declaring the production release complete.
