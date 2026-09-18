# Phase 09 — Accessory Enumeration, Thermostat Projection, and Reads

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-08.md`

**Prerequisites:** Phases 01–08; target completion of discovery, crypto, Pair Setup, and Pair Verify for the M1 decision.

## Objective

Enumerate the paired accessory database, project instance-ID-based thermostat capabilities, read current values with metadata/units/freshness, and issue the M1 protocol-feasibility decision.

## Why this phase exists

This is the first domain phase. It remains read-only so accessory schema/capability surprises are resolved before any thermostat write is possible.

## Authoritative requirements

- PRIMARY: `OBJ-06`, `OBJ-07`
- Supporting: `ARC-03`, `ARC-11`

## Relevant design sections

- `Thermostat application service`
- `Normal session and commands`
- `HAP controller core`
- acceptance `Capability observations`

## In scope

- Implement encrypted accessory enumeration and characteristic read requests/status parsing.
- Preserve accessory/service/characteristic instance IDs, types, permissions, format, range, step, and units.
- Project current temperature and optional humidity, targets/thresholds, mode, state, and display units without name matching.
- Distinguish absent/unsupported, malformed metadata/value, per-characteristic status, and transport failure.
- Show sanitized capabilities, values, freshness timestamp, and source.
- Complete M1 evidence from Phases 04–09.

## Explicitly out of scope

- Writes, subscriptions, polling loops, background recovery, assumptions about cloud-only ecobee features

## Expected repository changes

Existing prerequisites: encrypted session API and earlier target evidence.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/core/accessories/`
- `spikes/ecobee-hap-poc/src/application/thermostat/`
- `spikes/ecobee-hap-poc/test/accessories/`, `test/thermostat/`
- read-only capability UI
- `implementation_evidence/ecobee-hap-poc/phase-09.md`

## Required implementation behavior

- Identity uses HAP type plus AID/IID, never localized/display names.
- Unknown services/characteristics are retained or ignored safely, not treated as malformed thermostat data.
- Unit conversion is explicit and tested; do not infer display units from locale.
- Failed/stale reads cannot overwrite newer generation values.
- Enumeration/log evidence is sanitized before persistence.

## Tests

- Sanitized synthetic/upstream accessory databases: complete, minimal, optional, unknown, duplicate/malformed, mixed per-characteristic errors.
- Numeric format/range/unit conversions and stale-generation discard.
- Physical enumeration/read and completed capability table.
- M1 checklist reconciliation.

## Acceptance focus

- PRIMARY: `HAP-006`, `HAP-007`; M1 decision.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/accessories test/thermostat
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-09.md`; record sanitized capability table, read results/metadata, tests, and M1 `PASS | FAIL | PENDING TARGET | BLOCKED` with prerequisite reconciliation.

## Exit criteria

- [ ] Enumeration/read projection is typed, instance-based, and tested.
- [ ] Representative target current temperature is read or target status is explicit.
- [ ] Optional capabilities are observed rather than assumed.
- [ ] M1 is honestly decided; an essential M1 failure stops later phases unless the charter's bounded replacement rule is used.
- [ ] Evidence is complete and no write path exists.

