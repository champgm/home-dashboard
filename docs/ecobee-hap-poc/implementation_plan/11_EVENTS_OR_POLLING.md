# Phase 11 — Event Subscription and Bounded Polling Decision

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-10.md`

**Prerequisites:** M1 and Phase 10.

## Objective

Measure target event-subscription behavior for relevant thermostat characteristics and select either events or a bounded foreground polling fallback with explicit freshness/traffic policy.

## Why this phase exists

Observation is its own long-lived state machine. It is resolved before general reconnect so Phase 12 has one explicit policy to restore rather than two speculative implementations.

## Authoritative requirements

- PRIMARY: `OBJ-09`, `ARC-12`
- Supporting: `ARC-09`, `ARC-11`

## Relevant design sections

- `Events, polling, and lifecycle`
- `Normal session and commands`
- `Connection and state model`

## In scope

- Implement HAP event subscription only for event-capable projected characteristics.
- Parse interleaved event messages through the existing session stream.
- Record freshness/source and discard events from stale session generations.
- Measure external thermostat changes and app-initiated changes in foreground.
- If events are absent/unreliable, implement one cancellable serialized foreground polling scheduler with bounded interval/backoff.
- Record delivery latency, missed observations, poll traffic, staleness, and final policy.

## Explicitly out of scope

- Background continuous operation, Android services, production battery SLA, full reconnect orchestration

## Expected repository changes

Existing prerequisites: read model, encrypted event channel, command path.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/core/events/`
- `spikes/ecobee-hap-poc/src/application/observation/`
- `spikes/ecobee-hap-poc/test/events/`, `test/observation/`
- `spikes/ecobee-hap-poc/docs/OBSERVATION_POLICY.md`
- `implementation_evidence/ecobee-hap-poc/phase-11.md`

## Required implementation behavior

- Subscribe only when metadata permits; subscription acknowledgement is not an event.
- Events and polls cannot overwrite a newer generation/value.
- Polls never overlap, never continue after stop/background, and use bounded backoff.
- UI distinguishes event, poll, command reconciliation, and initial-read sources.
- Select one documented production-candidate foreground policy from evidence.

## Tests

- Subscription success/error, fragmented/interleaved events, duplicate/out-of-order/stale-generation events.
- Fake-clock polling cadence, cancellation, non-overlap, timeout/backoff, recovery.
- Physical target changes with measured event delivery; fallback measurement if necessary.
- Diagnostic/freshness display tests.

## Acceptance focus

- PRIMARY: `HAP-010`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/events test/observation
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-11.md`; include event/poll measurements, traffic/staleness, selected policy/rationale, tests, and pending target work.

## Exit criteria

- [ ] Event path and/or bounded fallback is deterministic and tested.
- [ ] One foreground observation policy is selected from target evidence.
- [ ] No background service or overlapping poller exists.
- [ ] `HAP-010` is honestly classified and evidence is complete.

