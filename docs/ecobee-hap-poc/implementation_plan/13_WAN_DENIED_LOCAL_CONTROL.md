# Phase 13 — WAN-Denied Cold-Start Local Control

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-12.md`

**Prerequisites:** M1 PASS and Phases 10–12 complete.

## Objective

Prove cold-start discovery/resolution, Pair Verify, read, safe setpoint write/read-back, thermostat restart recovery, and observation while thermostat Internet access is independently denied; issue the M2 decision.

## Why this phase exists

WAN independence is the central product hypothesis and requires router/firewall evidence rather than more application implementation. It follows recovery work so a thermostat restart under denial is meaningful.

## Authoritative requirements

- PRIMARY: `OBJ-11`
- Supporting: `SAFE-03`, `ARC-13`

## Relevant design sections

- `Discovery and network policy`
- acceptance `WAN-denial procedure`
- charter `M2 — Local control proven`

## In scope

- Confirm all deterministic suites before network manipulation.
- With operator-controlled router/firewall, deny thermostat WAN while preserving same-LAN unicast/multicast.
- Independently verify denial using counters or sanitized packet observation.
- Force-stop/cold-start; resolve, verify, enumerate/refresh, read, safely write/confirm/restore.
- Restart thermostat under the rule and repeat recovery/read/write.
- Audit code/config/runtime observations for any app cloud dependency.
- Record unrelated ecobee cloud/weather warnings separately.
- Reconcile M2 prerequisites and decide M2.

## Explicitly out of scope

- App-driven router configuration, VPN/custom routes, bypassing network policy, implementation of missing major subsystems

## Expected repository changes

Existing prerequisites: completed control/recovery spike and prior evidence.

Expected outputs:

- Only narrow diagnostic/test-hook fixes if a defect is found; no planned new subsystem
- sanitized artifacts under `implementation_evidence/ecobee-hap-poc/`
- `implementation_evidence/ecobee-hap-poc/phase-13.md`

## Required implementation behavior

- Denial is scoped to thermostat Internet access, not LAN reachability.
- Earlier sessions expire before the cold-start proof.
- Packet/router evidence is sanitized before commit.
- A failure is diagnosed and returned to its owning phase; do not patch around it with cloud or routing machinery.

## Tests

- Execute all nine steps in the authoritative WAN-denial procedure.
- Re-run relevant HAP-001/004/007/008/011 checks under denial.
- Inspect package/source/config and observed destinations for cloud dependencies.
- M2 prerequisite reconciliation.

## Acceptance focus

- PRIMARY: `HAP-012`, `HAP-013`; supporting `HAP-001`, `HAP-004`, `HAP-007`, `HAP-008`, `HAP-011`; M2 decision.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

Router/firewall and packet-observation procedures are environment-specific and must be recorded exactly in evidence; the app must not automate them.

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-13.md`; record denial mechanism/proof, cold-start and restart traces, safe write/restoration, observed destinations, cloud audit, and M2 result.

## Exit criteria

- [ ] Thermostat WAN denial is independently demonstrated while LAN remains available.
- [ ] Required cold-start/restart local operations pass under denial or are explicitly failed/blocked.
- [ ] No cloud/routing workaround was introduced.
- [ ] `HAP-012`/`HAP-013` and M2 are honestly decided.
- [ ] Evidence is sanitized and complete.

