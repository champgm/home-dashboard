# Phase 06 — TCP and HAP Wire Transport

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `spikes/ecobee-hap-poc/docs/HAP_SOURCE_DECISION.md`
- `implementation_evidence/ecobee-hap-poc/phase-05.md`

**Prerequisites:** Phases 01–05.

## Objective

Implement the adapterized IP-HAP byte path: bounded TCP, incremental HTTP message parsing, TLV8 codecs, and encrypted-record framing independent of pairing state machines.

## Why this phase exists

TCP fragmentation/coalescing, HTTP bodies, TLV concatenation/separators, and encrypted record boundaries form one byte-stream concern. Isolating it keeps Pair Setup and Verify phases focused on authenticated state transitions.

## Authoritative requirements

- PRIMARY: `ARC-03`, `ARC-06`
- Supporting: `SAFE-03`, `SAFE-04`, `ARC-07`

## Relevant design sections

- `HAP controller core`
- `TCP adapter`
- `Normal session and commands`

## In scope

- Install/wrap `react-native-tcp-socket` inside the spike.
- Adapt only approved IP-HAP core/source modules with provenance headers.
- Implement cancellable connect/read/write/close with bounds and terminal-state reporting.
- Implement incremental HAP HTTP request/response/event parsing and serialization.
- Implement TLV8 encode/decode including repeated values, separators, length bounds, and unknown types.
- Implement encrypted record split/join and authentication interface using Phase 04 crypto; keys are injected session state.
- Add deterministic fake byte stream supporting arbitrary fragmentation, coalescing, EOF, error, and possible-send injection.

## Explicitly out of scope

- Pair Setup/Verify transitions, accessory selection, credential persistence, HTTP endpoints above generic messages, retries

## Expected repository changes

Existing prerequisites: ports, crypto adapter, source decision, discovery endpoint type.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/core/wire/`, `src/hap/transport/`
- `spikes/ecobee-hap-poc/test/wire/`, `test/transport/`
- spike package/lock/native configuration updates
- `implementation_evidence/ecobee-hap-poc/phase-06.md`

## Required implementation behavior

- Treat TCP as an arbitrary byte stream; no read callback equals a HAP message boundary.
- Enforce declared-length/header/TLV/record bounds before allocation.
- Authentication failure terminates the session and exposes no unauthenticated plaintext.
- Socket write completion is not accessory command success.
- Timeout/cancel/error closes exactly once and stale callbacks cannot revive the transport.

## Tests

- Known TLV and encrypted-record vectors from approved upstream source.
- Exhaustive representative fragmentation/coalescing for HTTP headers/body, events, TLV, and encrypted records.
- Oversize, malformed length, truncated EOF, altered tag, timeout-before-send, and possible-send failure.
- Socket terminal-state and diagnostic redaction assertions.

## Acceptance focus

- Infrastructure for `HAP-003` through `HAP-010`; no live acceptance criterion completes here.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/wire test/transport
npm --prefix spikes/ecobee-hap-poc run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-06.md`; record adapted modules/provenance, bounds, fragmentation matrix, possible-send semantics, and material files.

## Exit criteria

- [ ] Byte-stream/TLV/HTTP/encrypted-record layers are independently tested.
- [ ] Transport has bounded cancellation and exactly-once terminal behavior.
- [ ] No pairing/business logic or automatic retry entered the layer.
- [ ] Evidence is complete and diagnostics contain no bytes/secrets.

