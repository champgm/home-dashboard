# Phase 10 — Safe Setpoint Writes and Ambiguity Reconciliation

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-09.md`

**Prerequisite:** M1 passed in Phase 09.

## Objective

Implement one predefined operator-confirmed setpoint command that selects the target-exposed writable representation, validates it, classifies transmission outcomes, and confirms or reconciles through authoritative read-back.

## Why this phase exists

Write safety and possible-send ambiguity are one cohesive command state machine. Keeping it separate from subscriptions/reconnect prevents events from masking incorrect write semantics.

## Authoritative requirements

- PRIMARY: `OBJ-08`, `SAFE-06`, `SAFE-07`, `ARC-11`
- Supporting: `SAFE-05`, `ARC-06`

## Relevant design sections

- `Thermostat application service`
- `Normal session and commands`
- acceptance `Capability observations`

## In scope

- Select writable `TargetTemperature` or applicable heating/cooling threshold from actual permissions/current mode.
- Validate numeric format, min/max/step, units, current mode, and separately configured operator-approved occupied-safe range.
- Add explicit confirmation UI with before/intended values.
- Implement characteristic write and immediate authoritative read-back.
- Classify confirmed success, definite failure, ambiguous, unsupported, and reconciliation failure.
- Inject drop-before-send and drop-after-possible-send faults; never automatically replay.
- Execute one safe target write and restoration on hardware.

## Explicitly out of scope

- HVAC mode writes, schedules/holds semantics, repeated writes, event subscription as confirmation dependency, retry queues

## Expected repository changes

Existing prerequisites: Phase 09 capability/read model and encrypted session.

Expected outputs:

- `spikes/ecobee-hap-poc/src/application/thermostat/setpointCommand.ts`
- write support under `src/hap/core/accessories/`
- bounded write UI and `spikes/ecobee-hap-poc/test/commands/`
- `implementation_evidence/ecobee-hap-poc/phase-10.md`

## Required implementation behavior

- Never write a non-writable/unknown/out-of-range/off-step/wrong-mode characteristic.
- Transport send completion cannot publish success.
- Possible-send timeout/disconnect yields ambiguous, then read-back; no replay.
- Read-back mismatch remains failure/ambiguous as defined, not optimistic success.
- Restoration is a separately confirmed command and cannot conceal the first outcome.

## Tests

- Capability selection across heat/cool/auto and target-vs-threshold fixtures.
- Boundary/step/unit/safe-range validation.
- Definite rejection, per-characteristic error, read-back match/mismatch/malformed, before-send and possible-send faults.
- Assertions for no automatic replay and non-sensitive diagnostics.
- Physical safe write, confirmation, and restoration.

## Acceptance focus

- PRIMARY: `HAP-008`, `HAP-009`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/commands test/thermostat
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-10.md`; record selected target capability/constraints in sanitized form, fault matrix, live before/write/read-back/restoration, and outcome classifications.

## Exit criteria

- [ ] Capability-aware safe write path is bounded and tested.
- [ ] Ambiguous possible-send behavior reconciles without replay.
- [ ] Physical command/restoration passes or is explicitly pending/failed.
- [ ] `HAP-008`/`HAP-009` are honestly classified and evidence is complete.

