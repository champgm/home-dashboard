# Ecobee Local HAP POC — Implementation Plan

## Authority

This is an experimental implementation plan, not a production Home Dashboard plan.

- `docs/ecobee-hap-poc/00_POC_CHARTER.md` defines **what** the POC must prove and its safety/scope constraints.
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md` defines the selected **how** for the POC.
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md` defines verification, evidence, and GO/NO-GO rules.
- This plan defines only implementation order, phase boundaries, dependencies, deliverables, verification work, and exit criteria.

The production `docs/SRS_2.4.1.yaml` and `docs/SAD_2.4.1.yaml` remain authoritative for the released Home Dashboard. They intentionally do not authorize HAP or mDNS. Nothing in this POC plan overrides them or permits code from `spikes/ecobee-hap-poc/` to enter the production app.

If implementation exposes ambiguity in the charter or acceptance contract that changes what success means, stop and record `POC SPECIFICATION DEFECT`; amend the source document before proceeding. If the technical design is contradictory or impractical, stop and record `POC DESIGN DEFECT`; amend the design rather than silently selecting a new architecture.

## Repository-root path convention

All paths and commands in this plan are relative to the repository root. Determine it with `git rev-parse --show-toplevel` and run commands from that directory.

Plan and evidence paths:

```text
docs/ecobee-hap-poc/implementation_plan/
spikes/ecobee-hap-poc/
implementation_evidence/ecobee-hap-poc/
```

The spike application does not exist before Phase 01. A path under `spikes/ecobee-hap-poc/` is an output unless the phase names an earlier phase that creates it.

## Execution rules

1. Execute phases in numeric order unless a phase explicitly permits independent work.
2. Before each phase, read the complete prerequisite documents listed in that phase file.
3. Re-read only the cited design sections and source files needed for the current objective; do not reconstruct unrelated later-phase reasoning.
4. Keep changes inside `spikes/ecobee-hap-poc/`, this plan, and `implementation_evidence/ecobee-hap-poc/` unless a specification amendment explicitly authorizes otherwise.
5. Do not modify the root application's `package.json`, lock file, Expo configuration, Android project, source, or tests.
6. Do not copy spike code into production or add a Thermostats tab during this plan.
7. Implement the narrowest behavior required by the current phase. Do not pull later state machines, UI, recovery, or generalized HomeKit support forward.
8. Write automated tests with the implementation. A final phase must not become the first meaningful test of an earlier subsystem.
9. Use explicit timeouts and cancellation for all network operations. Tests must not hang indefinitely.
10. Use fakes at adapter boundaries; do not make ordinary unit suites require a thermostat or LAN.
11. Preserve upstream/vector test provenance when adapting HAP code. Record source version/commit and local modifications.
12. Never place real setup codes, keys, pairing records, stable household identifiers, IP/MAC addresses, or sensitive packet payloads in source, fixtures, logs, screenshots, or committed evidence.
13. End each phase at a reviewable commit boundary with persisted evidence.

## Phase sequence and decision gates

| Phase | Objective | Gate advanced |
|---|---|---|
| 01 | Isolated app foundation, contracts, safe diagnostics | Foundation |
| 02 | HAP source/provider and governance decision | M3 prerequisite |
| 03 | Versioned secure credential persistence | M1 prerequisite |
| 04 | Exact HAP cryptographic primitive qualification | M1 |
| 05 | Android DNS-SD discovery and paired identity resolution | M1 |
| 06 | TCP byte stream, HAP HTTP/TLV, and encrypted-record transport | M1 prerequisite |
| 07 | Pair Setup, approved ownership handling, and durable commit | M1 |
| 08 | Pair Verify and repeatable encrypted sessions | M1 |
| 09 | Enumeration, thermostat projection, and reads | **M1 decision** |
| 10 | Safe setpoint writes and ambiguity reconciliation | M2 |
| 11 | Event subscription and bounded polling decision | M3 prerequisite |
| 12 | Lifecycle, reconnect, and stale-generation recovery | M2 |
| 13 | WAN-denied cold-start local control | **M2 decision** |
| 14 | Negative and failure semantics | M3 prerequisite |
| 15 | Security audit, unpair, and prior-association restoration | M3 |
| 16 | WAN-denied reliability run and resource stability | M3 |
| 17 | Final traceability and GO/CONDITIONAL GO/NO-GO decision | **M3/final decision** |

Phases 04, 05, 07, 08, 09, 13, 15, and 16 contain physical-target checks. Their local implementation/tests may proceed without a target where stated, but their phase evidence must say `PENDING TARGET`. M1, M2, M3, and final GO may never be passed from mocks or desktop execution.

### Current workspace sequencing caveat

In this workspace, the implementations and reconciliation for Phases 10–17 were completed speculatively before their physical prerequisites were closed. Their evidence files must remain marked `SPECULATIVE IMPLEMENTATION COMPLETE` (or `SPECULATIVE RECONCILIATION COMPLETE`) and `PENDING TARGET`/`BLOCKED` as applicable. Validate them sequentially only after M1/Phases 04–09, then M2/Phases 10–13, then M3/Phases 14–16, followed by Phase 17 reconciliation; deterministic tests and the in-app status sheet do not advance a target gate.

## Testing expectations

The Phase 01 application must expose these scripts in `spikes/ecobee-hap-poc/package.json`:

```text
typecheck
test
test:ci
android
```

Use root-relative invocation so commands are independent of an unstated working directory:

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
npm --prefix spikes/ecobee-hap-poc run android -- --device
```

When a phase lists a narrower Jest path, pass it after `--`, for example:

```sh
npm --prefix spikes/ecobee-hap-poc run test:ci -- test/crypto
```

Each phase that adds configuration, credentials, persistence, networking, recovery, or startup checks must test useful non-sensitive diagnostics for its owned failures. Logs should identify operation, phase, result class, duration, and sanitized accessory alias where relevant, without protocol secrets.

## Target-gated work

Target-gated checks require the exact Expo 57 / React Native 0.86 / Hermes Android development build on a representative physical phone and, where specified, the representative ecobee thermostat.

- Complete all deterministic local tests first.
- Never replace a hardware check with a mock and call it passed.
- Record unavailable work as `PENDING TARGET` with the exact pending command/procedure.
- A later integration phase may close an earlier pending item, but must update both its own evidence and the originating phase evidence.
- Do not block unrelated pure logic because hardware is temporarily unavailable.
- Do not perform pairing removal, thermostat restart, DHCP manipulation, or WAN denial without the approvals and safety preconditions in the charter.

## No-scope-creep rules

The following require a charter/design revision and are not permitted as implementation convenience:

- production Home Dashboard integration;
- Home Assistant, a cloud API, HomeKit hub, or application backend;
- BLE HAP, general-purpose HomeKit, multiple homes/controllers, or iOS;
- schedules, comfort profiles, vacations, weather, history, or sensor-management features;
- custom VPN routing, multicast relays, router automation, or arbitrary endpoint entry;
- automatic write replay, automatic Pair Setup retry, or automatic destructive pairing repair;
- factory reset or HVAC equipment-configuration changes;
- a raw TCP/HTTP/characteristic console;
- hand-written cryptographic primitives or unqualified algorithm substitution.

## Evidence and handoff protocol

Every phase creates or updates `implementation_evidence/ecobee-hap-poc/phase-XX.md` using `99_PHASE_HANDOFF_TEMPLATE.md`.

Evidence must include:

- work completed and files materially changed;
- primary/supporting plan IDs;
- tests and commands with actual results;
- acceptance criteria exercised;
- sanitized target/environment details where relevant;
- known limitations and every `PENDING TARGET` item;
- deviations, specification/design defects, and their disposition;
- explicit handoff notes for the next phase.

Do not leave important decisions only in chat output. Do not mark a criterion passed without the evidence required by `02_ACCEPTANCE_AND_EVIDENCE.md`.

Before ending a phase:

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
python3 docs/ecobee-hap-poc/implementation_plan/validate_plan.py
git diff --check
```

The first two commands apply after Phase 01 creates the spike. A phase may also require narrower or target commands.

## Completion rules

A phase is incomplete until:

- all in-scope deliverables exist;
- required deterministic tests pass;
- required target checks pass or are explicitly permitted and recorded as `PENDING TARGET`;
- diagnostics for introduced failure modes are verified;
- its evidence file is complete;
- no unresolved implementation issue is silently deferred;
- no specification/design defect is silently resolved in code;
- no later-phase work was pulled forward without a recorded dependency reason.

Phase 17 must create `implementation_evidence/ecobee-hap-poc/final-traceability-status.md`, reconcile every mandatory plan ID and HAP acceptance criterion, close or block every target-gated check, and issue the decision defined by the charter.
