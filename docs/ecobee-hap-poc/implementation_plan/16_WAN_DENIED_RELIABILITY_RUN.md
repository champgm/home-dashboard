# Phase 16 — WAN-Denied Reliability and Resource-Stability Run

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-15.md`

**Prerequisites:** M2 PASS; Phases 11–15 acceptance paths complete; target paired again if Phase 15 cleanup removed it.

## Objective

Execute the authoritative eight-hour foreground reliability run with thermostat WAN denied, fixed health-probe denominator, safe writes/restoration, forced interruptions, and resource/error measurements.

## Why this phase exists

The soak has a large elapsed-time and evidence surface but should implement no major subsystem. Isolating it prevents reliability failures from being normalized as last-minute code changes without rerunning owning tests.

## Authoritative requirements

- No new PRIMARY implementation IDs; verifies `OBJ-05`, `OBJ-08`–`OBJ-11`, `ARC-06`, `ARC-09`, `ARC-11`, `ARC-12`

## Relevant design sections

- `Events, polling, and lifecycle`
- `Discovery and network policy`
- acceptance `Reliability run` and `WAN-denial procedure`

## In scope

- Freeze app build/commit and predeclare run window/interruption windows.
- Verify thermostat WAN denial and LAN preservation before/during run.
- Keep selected observation policy active and issue one explicit current-temperature read each minute.
- Execute at least one approved write plus restoration per hour.
- Force at least two background/foreground cycles and one Wi-Fi reconnect.
- Record at least 480 scheduled probes before permitted exclusions, latency, failures, freshness, reconnects, sockets/sessions, memory trend where observable, and every error category.
- If a defect requires code change, stop, return it to its owning phase, rerun relevant tests, and start a newly identified soak.

## Explicitly out of scope

- New features, threshold relaxation after results, hidden run restart, excluding unexplained failures, production SLA claims

## Expected repository changes

Existing prerequisites: frozen POC build and completed prior evidence.

Expected outputs:

- sanitized run artifacts under `implementation_evidence/ecobee-hap-poc/`
- `implementation_evidence/ecobee-hap-poc/phase-16.md`
- code changes only through a documented return to the owning phase

## Required implementation behavior

- Health reads are independent of event/poll policy and counted deterministically.
- Exclusions are only predeclared timestamped interruption windows.
- Writes/restorations retain normal confirmation and ambiguity semantics.
- No re-pair, crash, unreconciled ambiguous write, or concealed resource trend.
- A failed run remains evidence; a rerun has a new ID and rationale.

## Tests

- Pre-run full deterministic suite.
- Exact reliability-run procedure from acceptance document.
- Post-run full deterministic suite and evidence secret scan.
- Reconcile supporting HAP-005/007/008/010/011/012/013 observations.

## Acceptance focus

- Supporting/closure: `HAP-005`, `HAP-007`, `HAP-008`, `HAP-010`, `HAP-011`, `HAP-012`, `HAP-013`; authoritative reliability gate.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

The eight-hour procedure is manual/target-gated and must be recorded with start/end timestamps, build identity, denominator, exclusions, and actual result.

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-16.md`; record run ID, environment, WAN proof, probe/write/interruption tables, metrics, errors, pass calculation, reruns, and sanitized artifact links.

## Exit criteria

- [ ] One identified eight-hour run has complete denominator and interruption evidence.
- [ ] WAN denial remained verified throughout.
- [ ] Reliability thresholds pass or failure/block is explicit.
- [ ] No result was discarded or threshold changed silently.
- [ ] Evidence is complete and sanitized; no major implementation was added here.
