# Configuration Defaults Change — Phase Handoff

## Phase

- Phase: `01 — Authoritative Specification Revision`
- Status: `COMPLETE`
- Commit/revision: working tree
- Date: `2026-08-23`

## Work completed

- Created approved `SRS_2.1.0.yaml` and `SAD_2.1.0.yaml`.
- Defined bundled bridge/plug defaults, sparse phone-local overrides, user additions, removal tombstones, update precedence, reset, migration, and fail-closed corruption/I/O behavior.
- Added the 2.1 mechanical validator and adversarial baseline review.
- Preserved the permanent single-bridge and protected HueBinding invariants.

## Requirement IDs addressed

### Primary

- `HUE-001`, `HUE-012`, `TPL-002`, `TPL-009`, `CON-005`, `DATA-001`, `DATA-002`, `DATA-003`, `DATA-005`

### Supporting

- `SEC-001`, `CON-002`, `CON-010`, `TPL-010`, `PRIV-001`, `PRIV-002`, `PRIV-004`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-001` | PASS | Revised SRS/SAD default/override contract |
| `AC-TPL-009` | PASS | Revised update/removal/addition contract |
| `AC-DATA-001` | PASS | Revised phone-local overlay contract |
| `AC-DATA-002` | PASS | Revised A→B update behavior |
| `AC-DATA-003` | PASS | Revised corruption/reset behavior |
| `AC-DATA-005` | PASS | Revised storage-I/O behavior |
| `AC-HUE-017` | PASS | Reset explicitly excludes protected HueBinding |

## Tests and checks executed

```text
python3 docs/validate_home_dashboard_docs_2.1.0.py
requirements=85
acceptance=85
sad_covered_requirements=85
errors=0
git diff --check
PASS
```

## Files materially changed

- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `docs/validate_home_dashboard_docs_2.1.0.py`
- `docs/BASELINE_REVIEW_2.1.0.md`

## Configuration-generation evidence

- Bundled-default generation(s) used: contract defines A→B; runtime generation is implemented in Phase 02.
- Persisted schema version(s) exercised: contract defines v1→v2; runtime migration is implemented in Phase 03.
- Migration fixture(s): planned for Phase 03.
- Override/removal cases exercised: specification review only; automated tests are Phase 02–07 work.

## Diagnostics / privacy evidence

- Corruption/I/O failure exercised: specified and mechanically reviewed; runtime tests are later phases.
- User-visible diagnostic: local configuration error plus explicit Reset Local Configuration.
- Sensitive-data check: HueBinding and credentials are explicitly excluded from the overlay/defaults.

## Known limitations

- The household Hue bridge IPv4 address was not present in the repository, so the baseline specifies an optional validated bridge default without inventing an address.

## Target-dependent checks not yet performed

- `PENDING TARGET`: signed in-place APK update and two-physical-phone acceptance belong to Phase 07.

## Deviations or discovered specification problems

- None. Missing household bridge address is deployment data, not an SRS/SAD contradiction.

## Scope check

- [x] No bridge switching/replacement behavior was introduced.
- [x] No cloud configuration synchronization was introduced.
- [x] Protected HueBinding semantics were not weakened.
- [x] Explicitly removed bundled plugs cannot be resurrected by update.
- [x] No arbitrary new defaultable fields were introduced outside SRS/SAD 2.1.0.

## Handoff notes for next phase

- What now exists: approved 2.1 authority, validator, and baseline review.
- Interfaces/files the next phase should rely on: `configuration_defaults_overlay_contract` in the SRS and `preseed_architecture` / `persistence_architecture` in the SAD.
- Pending target-gated work: signed update and real phones only.
- Migration notes: preserve current plug IDs because Favorites use `plugEndpointId`.
