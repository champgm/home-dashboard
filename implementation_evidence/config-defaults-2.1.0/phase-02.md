# Configuration Defaults Change — Phase Handoff

## Phase

- Phase: `02 — Bundled Defaults and Pure Resolution Model`
- Status: `COMPLETE`
- Commit/revision: working tree
- Date: `2026-08-23`

## Work completed

- Added validated `BundledDefaults` with the existing stable TP-Link IDs/IPs/ports.
- Added sparse `UserConfigOverlay`, deterministic resolution, canonical overlay conversion, and A→B behavior.
- Kept the bundled Hue bridge field optional because no household bridge IP was supplied.
- Retained `plugPreseed.ts` as a compatibility re-export.

## Requirement IDs addressed

### Primary

- `HUE-001`, `HUE-012`, `TPL-002`, `TPL-009`, `DATA-001`, `DATA-002`, `CON-010`

### Supporting

- Stable bundled plug identity and no-secret default-data invariants.

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-001` | PASS | `test/config/overlayResolver.test.ts` |
| `AC-TPL-009` | PASS | A/B resolution tests with override/removal/addition |
| `AC-DATA-002` | PASS | `test/config/overlayResolver.test.ts` |

## Tests and checks executed

```text
npm run typecheck
PASS
npm run test:ci -- test/config test/storage
5 suites, 36 tests passed
git diff --check
PASS
```

## Files materially changed

- `src/config/bundledDefaults.ts`
- `src/config/overlayResolver.ts`
- `src/config/plugPreseed.ts`
- `src/config/index.ts`
- `test/config/overlayResolver.test.ts`

## Configuration-generation evidence

- Bundled-default generations used: A and B.
- Persisted schema versions exercised: none; Phase 03 owns persistence.
- Migration fixtures: none; Phase 03 owns migration.
- Override/removal cases: bridge override, plug override, tombstone, user addition, changed/new defaults.

## Diagnostics / privacy evidence

- Corruption/I/O failure exercised: Phase 04.
- User-visible diagnostic: not changed in this pure phase.
- Sensitive-data check: bundled model contains only optional private IPv4 and plug endpoint metadata; no Hue credential.

## Known limitations

- The optional bundled bridge value remains unset until deployment supplies the household IP.

## Target-dependent checks not yet performed

- `PENDING TARGET`: none for pure logic.

## Deviations or discovered specification problems

- None.

## Scope check

- [x] No bridge switching/replacement behavior was introduced.
- [x] No cloud configuration synchronization was introduced.
- [x] Protected HueBinding semantics were not changed.
- [x] Explicitly removed bundled plugs cannot be resurrected by pure resolution.
- [x] No arbitrary defaultable fields were introduced.

## Handoff notes for next phase

- Use `resolveConfig`, `overlayFromConfig`, and `UserConfigOverlay` as the storage-independent boundary.
- Use current plug IDs as immutable physical identities.

