# Phase 05 — Android HAP Discovery and Identity Resolution

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `spikes/ecobee-hap-poc/docs/HAP_SOURCE_DECISION.md`
- `implementation_evidence/ecobee-hap-poc/phase-04.md`

**Prerequisites:** Phases 01–04.

## Objective

Discover `_hap._tcp` services on the active Android Wi-Fi LAN, resolve/deduplicate them into sanitized candidates, expose pairing state, and safely re-resolve a paired accessory identity.

## Why this phase exists

Discovery is a target-specific native risk independent of HAP cryptography. Proving it before pairing prevents debugging mDNS, identity, and handshake failures simultaneously.

## Authoritative requirements

- PRIMARY: `OBJ-01`, `OBJ-02`, `SAFE-03`, `PAIR-01`, `ARC-05`, `ARC-13`
- Supporting: `SAFE-02`, `SAFE-10`

## Relevant design sections

- `Discovery adapter`
- `Discovery and network policy`
- `Pairing flow` steps 1–4
- `Connection and state model`

## In scope

- Install/configure the Phase 02-approved DNS-SD native module in the spike.
- Implement start/stop, resolve, dedupe, remove, interface/address change, generation cancellation, and bounded discovery timeout.
- Parse only required HAP TXT fields, including pairing availability, without logging full records.
- Accept only HAP accessory category `ci=9` (Thermostat). Ignore known non-thermostat categories, and fail closed for missing, malformed, or unknown category metadata.
- Validate IPv4 local/interface scope and reject public, loopback, unspecified, stale, or unrelated-interface endpoints.
- Minimal sanitized selection UI and paired-identity re-resolution API.
- Physical-device removal/reappearance and address-change characterization where controllable.

## Explicitly out of scope

- TCP connection, Pair Setup, automatic association removal, IPv6 support, multicast relay/VPN/router changes

## Expected repository changes

Existing prerequisites: Phase 01 ports/UI and Phase 02 provider decision.

Expected outputs:

- `spikes/ecobee-hap-poc/src/hap/discovery/`
- `spikes/ecobee-hap-poc/test/discovery/`
- discovery UI additions and native configuration
- `implementation_evidence/ecobee-hap-poc/phase-05.md`

## Required implementation behavior

- Browse only `_hap._tcp`; identity is never display name alone.
- Stale generations cannot repopulate stopped/restarted discovery.
- Selection uses a currently resolved validated endpoint; later paired operations match HAP accessory identity.
- Existing-pairing indication is informational and cannot trigger destructive action.
- A DNS-SD record is selectable only when its category is exactly `ci=9`; category metadata that is missing, malformed, or not supported is ignored.
- UI/evidence omits raw IP, MAC, complete TXT, and stable accessory ID.

## Tests

- Unit tests for TXT parsing, dedupe, remove/reappear, generation discard, timeout, and endpoint validation.
- Category tests cover thermostat acceptance, known non-thermostat rejection, and conservative handling of missing, malformed, and unknown categories.
- Fake-native integration tests for address/interface changes and malformed records.
- Physical Android browse/resolve/removal/reappearance; controlled DHCP change if safely available.
- Diagnostic redaction inspection.

## Acceptance focus

- PRIMARY: `HAP-001`, `HAP-002`.

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/discovery
npm --prefix spikes/ecobee-hap-poc run android -- --device
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-05.md`; record native provider/version, sanitized service sequence/timings, pairing-state observation, endpoint rejection tests, and pending target work.

## Exit criteria

- [ ] Discovery adapter handles lifecycle, identity, and endpoint validation deterministically.
- [ ] Physical discovery evidence exists or is explicitly `PENDING TARGET`.
- [ ] No destructive pairing behavior or routing machinery was introduced.
- [ ] `HAP-001`/`HAP-002` are honestly classified and evidence is complete.
