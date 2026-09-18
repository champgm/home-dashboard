# Phase 07 — Pair Setup, Ownership Safety, and Durable Commit

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-06.md`

**Prerequisites:** Phases 01–06; Phase 04 target crypto must pass before live pairing.

## Objective

Implement one-at-a-time HAP Pair Setup with explicit operator action, pairing-ownership preflight, authenticated transcript validation, and durable commit/repair semantics; prove one approved target pairing where available.

## Why this phase exists

Pair Setup is a security-sensitive state machine that can mutate accessory ownership. It is isolated from Pair Verify and thermostat operations so failures cannot trigger uncontrolled retries or destructive recovery.

## Authoritative requirements

- PRIMARY: `OBJ-03`, `SAFE-05`, `SAFE-08`, `SAFE-10`, `PAIR-02`, `PAIR-03`, `PAIR-04`, `ARC-10`
- Supporting: `PAIR-01`, `ARC-07`, `ARC-08`

## Relevant design sections

- `Pairing flow`
- `Credential store adapter`
- `Connection and state model`
- charter `Pairing ownership prerequisite`

## In scope

- Adapt/implement Pair Setup TLV/SRP/authentication transitions with explicit timeouts and error mapping.
- Masked, memory-only setup-code entry and explicit confirmation.
- Preflight displayed pairing state and require recorded approval/restoration plan when an existing association would be removed.
- Enforce single active Pair Setup; no automatic retry.
- Commit pairing record only after accessory success; on persistence failure mark indeterminate/repair-required and preserve diagnostics.
- Provide a non-destructive local test harness and one approved physical pairing.
- Verify thermostat remains safely locally operable after any approved association change.

## Explicitly out of scope

- Pair Verify, characteristic access, accessory-side unpair, Apple Home restoration, factory reset, HVAC configuration changes

## Expected repository changes

Existing prerequisites: credential, crypto, discovery, and wire adapters from Phases 03–06.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/core/pairSetup/`
- `spikes/ecobee-hap-poc/src/application/pairing/`
- pairing UI and `spikes/ecobee-hap-poc/test/pairSetup/`
- `implementation_evidence/ecobee-hap-poc/phase-07.md`

## Required implementation behavior

- Reject malformed/out-of-order/duplicate/authentication-failed transitions.
- Setup code never enters logger, AsyncStorage, clipboard, evidence, or durable record.
- Accessory-success/local-commit-failure is not reported as unpaired or success.
- Wrong code/rate-limit/busy/already-paired states are actionable and do not loop.
- No code path performs factory reset or changes HVAC equipment configuration.

## Tests

- Retained upstream/fixture transcript tests plus every invalid transition.
- Wrong code, accessory busy/already paired, disconnect at each step, timeout, cancellation, double-submit.
- Accessory success followed by each credential-store failure.
- UI/log/storage secret audit.
- Approved physical Pair Setup with sanitized phase timings and safety/restoration preconditions.

## Acceptance focus

- PRIMARY: `HAP-003`; supporting `HAP-015`, `HAP-016`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/pairSetup test/credentials
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-07.md`; record pairing precondition/approval without household identifiers, transcript tests, live result, store outcome, safety check, and pending target work.

## Exit criteria

- [ ] Pair Setup transitions and negative paths pass deterministic tests.
- [ ] Durable commit/indeterminate behavior is proven.
- [ ] Live pairing passes under approved conditions or is `PENDING TARGET`.
- [ ] `HAP-003` is honestly classified; no automatic retry/reset exists.
- [ ] Evidence is complete and Pair Verify was not pulled forward.

