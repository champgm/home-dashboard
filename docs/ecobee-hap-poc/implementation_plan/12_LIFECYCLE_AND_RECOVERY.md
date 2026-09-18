# Phase 12 — Lifecycle, Reconnect, and Stale-Generation Recovery

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `spikes/ecobee-hap-poc/docs/OBSERVATION_POLICY.md`
- `implementation_evidence/ecobee-hap-poc/phase-11.md`

**Prerequisites:** Phases 01–11 and a selected observation policy.

## Objective

Implement a foreground lifecycle/reconnect coordinator that re-resolves identity, performs Pair Verify, refreshes state, restores observation, and recovers from the required interruptions without re-pairing or stale publication.

## Why this phase exists

This phase integrates established adapters under one recovery state machine. Pairing, command semantics, and event-policy decisions are already closed, limiting its active reasoning set to lifecycle ownership and recovery ordering.

## Authoritative requirements

- PRIMARY: `OBJ-10`
- Supporting: `ARC-05`, `ARC-09`, `ARC-12`, `SAFE-07`

## Relevant design sections

- `Connection and state model`
- `Events, polling, and lifecycle`
- `Discovery and network policy`

## In scope

- Observe foreground/background and active Wi-Fi reachability/interface changes.
- On loss/background: cancel operations, stop observation, close session, mark freshness.
- On foreground/recovery: re-resolve paired identity, validate endpoint, Pair Verify, enumerate/validate, restore observation, authoritative refresh.
- Bounded reconnect backoff with explicit offline/recovering/repair-required diagnostics.
- Handle app background/foreground, Wi-Fi off/on, TCP refusal, thermostat restart, DHCP address change.
- Ensure in-flight command possible-send state is preserved for reconciliation, never replayed.

## Explicitly out of scope

- Pair Setup recovery, background service, WAN firewall manipulation, accessory unpair, infinite retry

## Expected repository changes

Existing prerequisites: discovery/session/read/write/observation modules.

Expected outputs:

- `spikes/ecobee-hap-poc/src/application/lifecycle/`
- `spikes/ecobee-hap-poc/test/lifecycle/`, `test/recovery/`
- recovery status UI
- `implementation_evidence/ecobee-hap-poc/phase-12.md`

## Required implementation behavior

- Recovery ordering is resolve → identity match → verify → enumerate/validate → observe → refresh.
- Each foreground/network epoch invalidates older callbacks and timers.
- Backoff is bounded/cancellable and resets only after stable ready state.
- No recovery path invokes Pair Setup or deletes credentials.
- No possible-send command is automatically repeated.

## Tests

- Fake-clock/state-machine transition coverage including repeated/overlapping lifecycle events.
- Each resilience-matrix scenario feasible with fakes; stale callbacks and timer cancellation.
- Physical background/foreground, Wi-Fi off/on, TCP refusal/restart, and controlled address change.
- Confirm restored observation and refreshed values after recovery.

## Acceptance focus

- PRIMARY: `HAP-011`; supporting `HAP-002`, `HAP-004`, `HAP-009`, `HAP-010`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/lifecycle test/recovery
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-12.md`; complete the resilience matrix with detection/recovery times, actions, verify/subscription/refresh status, faults, and pending checks.

## Exit criteria

- [ ] Recovery coordinator passes deterministic transition/fault tests.
- [ ] Required physical interruption cases recover without re-pairing or are explicitly pending/failed.
- [ ] No stale generation publishes and no command is replayed.
- [ ] `HAP-011` is honestly classified and evidence is complete.

