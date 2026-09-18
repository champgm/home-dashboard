# Ecobee Local HAP Controller — POC Charter

**Status:** Proposed experiment  
**Scope:** Android-first, one phone, one representative ecobee thermostat  
**Authority:** Non-authoritative. This document does not amend `SRS_2.4.1.yaml` or `SAD_2.4.1.yaml`.

## Decision being tested

Determine whether a React Native application can dependably discover, pair with, read, and control a deployed ecobee thermostat directly over the LAN using the HomeKit Accessory Protocol (HAP), including when the thermostat is denied WAN access.

The POC is successful only if it proves the complete path on representative hardware. A library compiling, discovery alone, or a one-time successful command is not sufficient.

## Why this is an isolated POC

The current production architecture explicitly says not to add DNS/mDNS without an SRS change to `DG-004`. HAP requires local service discovery, pairing cryptography, encrypted sessions, and persistent controller credentials. Those are material changes to the current system boundary.

The POC will therefore live in this repository as a separate minimal application at:

```text
spikes/ecobee-hap-poc/
```

Keeping it in the same repository preserves the exact toolchain and makes successful code easier to migrate. Keeping it out of the production application prevents experimental native dependencies, permissions, credentials, and navigation from changing the released app before feasibility is established.

The POC must target the production baseline unless an incompatibility is itself being characterized:

- Expo SDK 57
- React Native 0.86
- Hermes
- Android development build on a representative physical phone
- TypeScript

## Hypothesis

A small, explicitly adapted HAP controller can run reliably in React Native by separating protocol logic from platform services:

- HAP controller protocol derived from a maintained, testable implementation
- TCP supplied by `react-native-tcp-socket`
- mDNS/DNS-SD supplied by a React Native native module
- cryptographic primitives supplied by reviewed native or pure-JavaScript implementations with known-answer tests
- long-lived controller identity and pairing credentials stored in `expo-secure-store`

The experiment must disprove the hypothesis if an essential primitive is unavailable, interoperability is unstable, or recovery behavior is unsafe.

## POC objectives

The POC shall:

1. Discover the target thermostat through `_hap._tcp` without a configured IP address.
2. Display only redacted discovery metadata needed to select the thermostat.
3. Complete HAP Pair Setup using the thermostat's displayed or printed setup code.
4. Store the controller identity and pairing credentials in OS-protected storage.
5. Restart the app and complete Pair Verify without pairing again.
6. Enumerate the accessory, services, and characteristics.
7. Identify and read the thermostat capabilities actually exposed by the target, including current temperature and, when exposed, humidity, target temperature, HVAC mode, and operating state.
8. Write a safe thermostat setpoint change using the writable target-temperature or heating/cooling-threshold characteristic actually exposed by the target, and confirm it through authoritative read-back.
9. Determine whether relevant characteristic event subscriptions work reliably; if they do not, characterize a bounded polling fallback.
10. Recover from app backgrounding, TCP loss, thermostat restart, IP-address change, and phone Wi-Fi reconnection without corrupting pairing state.
11. Repeat discovery, connection, reads, and a safe write while WAN access is denied to the thermostat.
12. Produce sanitized evidence sufficient for a go/no-go production architecture decision.

## Explicitly out of scope

- A production Thermostats tab or production navigation changes
- Changes to `SRS_2.4.1.yaml` or `SAD_2.4.1.yaml`
- Home Assistant or any other bridge, hub, proxy, or cloud service
- The ecobee cloud API or cloud fallback
- Schedules, comfort profiles, vacation holds, weather, or historical data
- General-purpose HomeKit controller support
- Multiple homes, phones, controllers, or thermostat models
- iOS support
- Production credential migration or backup
- Polished UI, Favorites integration, or shared production state
- Automatic changes to router/firewall configuration

## Safety and security constraints

- Never log the HAP setup code, controller private key, accessory keys, session keys, complete pairing records, or unredacted protocol payloads containing secrets.
- Do not include real credentials or stable household identifiers in committed fixtures or evidence.
- Accept connections only to the address and port returned for the user-selected HAP service on the local network.
- Do not expose a general-purpose TCP, HTTP, or characteristic-writing console.
- Require an explicit user action for pairing, unpairing, and every write used by the POC.
- Limit test writes to an operator-approved, occupied-safe temperature range.
- Treat a write timeout or lost connection after transmission as ambiguous until read-back establishes the actual state.
- Do not repeatedly attempt Pair Setup after authentication failure or risk forcing an accessory reset.
- Make unpairing behavior and the consequences of deleting local credentials clear before either operation.
- Do not remove an existing Apple Home association, reset HomeKit pairing, or alter HVAC configuration without explicit operator approval and a documented restoration procedure.

## Pairing ownership prerequisite

Before Pair Setup testing, determine whether the thermostat already has a HomeKit controller association. Initial HAP Pair Setup may require an accessory with no existing HomeKit association; possession of the setup code alone must not be assumed to authorize or enable a second independent controller.

If an existing association must be removed for the experiment:

1. Record the existing association and the steps needed to restore it.
2. Obtain explicit operator approval for the disruption.
3. Prefer removing only the HomeKit association; do not factory-reset the thermostat or disturb HVAC equipment configuration.
4. Verify the thermostat remains safe and locally operable before continuing.
5. After the POC, remove the POC controller from the accessory where possible, delete its local credentials separately, and restore the prior HomeKit association if requested.

Deleting the POC's local credential record and removing the POC controller pairing from the thermostat are distinct operations. Neither may silently imply the other.

## Target assumptions to record before testing

The evidence record must identify, in sanitized form:

- ecobee model and firmware version
- phone model and Android version
- app build/commit
- Wi-Fi topology relevant to multicast and client isolation
- whether the thermostat was already paired to another HomeKit controller
- whether removal/restoration is required and has explicit operator approval
- how thermostat WAN denial was enforced and independently verified

Unknown values do not block initial implementation, but no hardware-dependent gate may be marked passed without them.

## Milestone decisions

The experiment has three cumulative decision points so an early protocol failure can stop the work without weakening the final GO gate.

### M1 — Protocol feasibility proven

- physical-device `_hap._tcp` discovery and endpoint resolution work;
- required cryptographic vectors pass on Hermes and the physical Android target;
- Pair Setup completes with approved pairing ownership conditions;
- the persisted record completes Pair Verify after a cold launch; and
- accessory enumeration and current-temperature read succeed.

Failure of an essential M1 primitive is an early NO-GO unless there is one bounded replacement candidate with a documented test.

### M2 — Local control proven

- a capability-appropriate, operator-approved setpoint write is confirmed by authoritative read-back;
- ambiguous writes are reconciled without automatic replay;
- ordinary app/network interruption recovers without re-pairing; and
- cold-start read and control work while thermostat WAN access is denied.

M2 establishes that the desired local-control use case works, but does not by itself authorize production planning.

### M3 — Dependability proven

- negative and recovery tests pass;
- the event-versus-polling decision is supported by measurements;
- security, dependency, specification-use, and maintenance reviews are complete; and
- the WAN-denied reliability run passes.

Only M3 completion permits the final GO decision below.

## Exit decision

### GO — revise the product specifications

Choose GO only when all critical criteria in `02_ACCEPTANCE_AND_EVIDENCE.md` pass on the representative target, no unresolved secret-handling defect exists, and the implementation has a credible maintenance boundary.

A GO authorizes planning, not silent production integration. The next step is an explicit SRS/SAD revision that addresses mDNS, HAP trust and credential lifecycle, supported thermostat capabilities, network policy, failure semantics, and production acceptance criteria.

### CONDITIONAL GO — resolve a bounded issue

Choose CONDITIONAL GO only when the end-to-end path works and remaining issues are narrow, measurable, and have an owner and deadline. Examples include tuning reconnection timing or replacing one platform adapter whose interface and fallback are already proven.

### NO-GO — stop integration

Choose NO-GO if any of the following remains true:

- the thermostat does not expose a usable HAP thermostat service;
- Pair Setup or Pair Verify cannot be implemented with reviewed, repeatable primitives;
- operation requires thermostat WAN access, an ecobee cloud API, Home Assistant, or another intermediary;
- credentials cannot be stored and recovered safely;
- ordinary lifecycle or network interruptions regularly require re-pairing;
- write outcomes cannot be reconciled safely;
- the required native surface is too broad or too fragile to maintain;
- package, HAP specification-use, certification, or other license obligations are incompatible with the intended distribution model.

## Deliverables

- This charter
- `01_TECHNICAL_DESIGN.md`
- `02_ACCEPTANCE_AND_EVIDENCE.md`
- A later isolated app under `spikes/ecobee-hap-poc/`
- Sanitized POC results under `implementation_evidence/ecobee-hap-poc/`
