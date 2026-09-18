# Phase 08 — Pair Verify and Repeatable Encrypted Sessions

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-07.md`

**Prerequisites:** Phases 01–07 and a valid target pairing for target checks.

## Objective

Implement Pair Verify, session-key derivation, encrypted-session lifecycle, cold-start credential recovery, and twenty repeatable fresh sessions with bounded resources.

## Why this phase exists

Pair Verify combines a distinct authenticated handshake with connection-generation ownership. It must be proven before accessory APIs add more HTTP and domain state.

## Authoritative requirements

- PRIMARY: `OBJ-05`, `ARC-09`
- Supporting: `ARC-06`, `ARC-07`, `ARC-08`

## Relevant design sections

- `Connection and state model`
- `Normal session and commands`
- `Credential store adapter`

## In scope

- Adapt/implement Pair Verify transcript and session-key derivation.
- Build a single-owner session coordinator with generations, cancellation, terminal close, and one active verify.
- Load persisted credentials after process reconstruction; never request setup code or Pair Setup.
- Expose encrypted generic request/event channel to Phase 09.
- Instrument sanitized handshake latency, socket terminal state/count, and available memory observations.
- Execute twenty fresh connect/verify/close cycles on target.

## Explicitly out of scope

- Accessory enumeration, characteristic operations, background reconnect policy, Pair Setup retry/repair

## Expected repository changes

Existing prerequisites: Pair Setup record, crypto, wire transport, credential store.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/core/pairVerify/`, `src/hap/session/`
- `spikes/ecobee-hap-poc/test/pairVerify/`, `test/session/`
- sanitized session diagnostics UI
- `implementation_evidence/ecobee-hap-poc/phase-08.md`

## Required implementation behavior

- Verify accessory identity/signature before accepting session keys.
- Stale connection callbacks cannot mutate the current generation.
- Any transcript/authentication failure closes the socket and clears session-only keys.
- Pair Verify failure preserves durable pairing data and enters explicit repair-required/recoverable state.
- Twenty-cycle metrics use defined socket idle count and recorded measurement tolerance.

## Tests

- Upstream/known transcript and key-derivation tests; altered identity/signature/public key.
- Fragmented messages, stale generation, parallel verify rejection, cancel/timeout at each transition.
- Cold service reconstruction using a committed fake-store record.
- Physical cold launch plus twenty fresh session cycles and resource observations.

## Acceptance focus

- PRIMARY: `HAP-004`, `HAP-005`; supporting `HAP-016`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/pairVerify test/session
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-08.md`; include cold-start trace, cycle table, tolerance definition, socket/memory/latency observations, failures, and pending target work.

## Exit criteria

- [ ] Pair Verify/session lifecycle passes deterministic adversarial tests.
- [ ] Cold start never invokes Pair Setup.
- [ ] Twenty target cycles meet HAP-005 or remain explicitly pending/failed.
- [ ] Durable credentials survive recoverable verification errors.
- [ ] Evidence is complete; accessory APIs remain out of scope.

