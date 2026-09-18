# Ecobee HAP POC — Final Traceability Status

## Run identity and decision context

- Run status: complete reconciliation of the implementation available in this workspace.
- Target: the Android Hermes runtime gate was exercised; the initial gate failed, then the bounded remediation rerun reported `7 passed · 0 failed`. HAP-001 now has an operator-recorded live Android discovery result; pairing and subsequent target protocol operations were not run.
- Evidence rule: deterministic tests establish implementation behavior only; they do not close physical-target criteria.
- Decision: `NO-GO` for this run under the charter. The Android crypto/runtime gate failed, target protocol evidence is still absent, and the distribution-governance decision remains unresolved.

## Status legend

- `IMPLEMENTED` — code or documented process exists and has deterministic support.
- `PENDING TARGET` — physical target or device evidence is required and unavailable.
- `BLOCKED` — an external decision or prerequisite prevents closure.
- `FAIL` — the exercised target gate produced a failure requiring remediation.
- HAP results use the acceptance vocabulary exactly.

## Sequencing caveat for Phases 10–17

Phases 10–17 are explicitly recorded as speculative implementations/reconciliation completed before their physical prerequisites were closed. Their deterministic tests establish implementation behavior only. Sequential target validation must proceed through M1/Phases 04–09, M2/Phases 10–13, M3/Phases 14–16, and then final Phase 17 reconciliation; no target-gated result below is upgraded by the app's status sheet alone.

## Mandatory plan traceability

| ID | Final status | Primary evidence | Note |
|---|---|---|---|
| OBJ-01 | `IMPLEMENTED` | [phase 05](phase-05.md) | HAP-001 records live `_hap._tcp` discovery, endpoint resolution, and browse removal/reappearance. |
| OBJ-02 | `IMPLEMENTED` | [phase 01](phase-01.md), [phase 05](phase-05.md) | Predefined UI and redacted discovery model exist. |
| OBJ-03 | `PENDING TARGET` | [phase 07](phase-07.md) | Simulated Pair Setup passes; approved target pairing not run. |
| OBJ-04 | `IMPLEMENTED` | [phase 03](phase-03.md) | Versioned protected credential store exists. |
| OBJ-05 | `PENDING TARGET` | [phase 08](phase-08.md) | Cold-start target verification and repeat cycles not run. |
| OBJ-06 | `PENDING TARGET` | [phase 09](phase-09.md) | Enumeration model passes; physical accessory not inspected. |
| OBJ-07 | `PENDING TARGET` | [phase 09](phase-09.md) | Current-temperature read requires the target. |
| OBJ-08 | `PENDING TARGET` | [phase 10](phase-10.md) | Capability-appropriate target write not run. |
| OBJ-09 | `PENDING TARGET` | [phase 11](phase-11.md) | Event/poll measurements require the target. |
| OBJ-10 | `PENDING TARGET` | [phase 12](phase-12.md) | Physical interruption matrix not run. |
| OBJ-11 | `PENDING TARGET` | [phase 13](phase-13.md) | WAN-denied target procedure not run. |
| OBJ-12 | `IMPLEMENTED` | [phase 17](phase-17.md) | Sanitized evidence and decision records are complete. |
| SAFE-01 | `IMPLEMENTED` | [phase 01](phase-01.md), [phase 15](phase-15.md) | Logger, scanner, and audit paths reject sensitive material. |
| SAFE-02 | `IMPLEMENTED` | [phase 01](phase-01.md), [phase 15](phase-15.md) | No real credentials or stable household identifiers committed. |
| SAFE-03 | `PENDING TARGET` | [phase 05](phase-05.md) | Endpoint policy passes locally; target endpoint not exercised. |
| SAFE-04 | `IMPLEMENTED` | [phase 01](phase-01.md), [phase 06](phase-06.md) | No arbitrary protocol console exists. |
| SAFE-05 | `IMPLEMENTED` | [phase 01](phase-01.md), [phase 07](phase-07.md) | Pairing and writes require explicit actions. |
| SAFE-06 | `PENDING TARGET` | [phase 10](phase-10.md) | Safe range enforcement exists; target capability is unknown. |
| SAFE-07 | `IMPLEMENTED` | [phase 10](phase-10.md), [phase 14](phase-14.md) | Ambiguous writes use read-back and no replay. |
| SAFE-08 | `IMPLEMENTED` | [phase 07](phase-07.md), [phase 14](phase-14.md) | Pair Setup has no uncontrolled retry loop. |
| SAFE-09 | `IMPLEMENTED` | [phase 15](phase-15.md) | Consequences are explained and cleanup operations are distinct. |
| SAFE-10 | `IMPLEMENTED` | [phase 07](phase-07.md), [phase 15](phase-15.md) | No reset/removal path runs without approval. |
| PAIR-01 | `PENDING TARGET` | [phase 05](phase-05.md) | Existing association state is unknown. |
| PAIR-02 | `PENDING TARGET` | [phase 07](phase-07.md) | Target restoration procedure and approval cannot be recorded. |
| PAIR-03 | `IMPLEMENTED` | [phase 07](phase-07.md) | No factory-reset or HVAC-configuration action is implemented. |
| PAIR-04 | `PENDING TARGET` | [phase 07](phase-07.md) | Post-association local operation requires the target. |
| PAIR-05 | `PENDING TARGET` | [phase 15](phase-15.md) | Distinct cleanup paths exist; restoration was not exercised. |
| ARC-01 | `IMPLEMENTED` | [phase 01](phase-01.md) | Isolated Expo app boundary is intact. |
| ARC-02 | `IMPLEMENTED` | [phase 01](phase-01.md) | Minimal masked-input UI and sanitized state are present. |
| ARC-03 | `IMPLEMENTED` | [phase 06](phase-06.md) | Core is adapterized and UI-independent. |
| ARC-04 | `IMPLEMENTED` | [phase 02](phase-02.md) | Upstream source and provider provenance are pinned. |
| ARC-05 | `PENDING TARGET` | [phase 05](phase-05.md) | Discovery lifecycle behavior is tested; live service changes are not. |
| ARC-06 | `IMPLEMENTED` | [phase 06](phase-06.md) | Bounded cancellable streaming transport is present. |
| ARC-07 | `FAIL` | [phase 04](phase-04.md) | Initial Android Hermes runtime exposed the SRP/Node-crypto incompatibility; the remediation rerun reported 7/0 but is not promoted over the recorded gate. |
| ARC-08 | `IMPLEMENTED` | [phase 03](phase-03.md) | Versioned protected records and repair states are present. |
| ARC-09 | `IMPLEMENTED` | [phase 08](phase-08.md), [phase 12](phase-12.md) | Generation-safe session ownership is tested. |
| ARC-10 | `IMPLEMENTED` | [phase 07](phase-07.md), [phase 14](phase-14.md) | Confirmed-only persistence and repair behavior are tested. |
| ARC-11 | `PENDING TARGET` | [phase 10](phase-10.md) | Freshness and write logic exist; target capabilities are unknown. |
| ARC-12 | `PENDING TARGET` | [phase 11](phase-11.md) | Observation implementation exists; target reliability is unmeasured. |
| ARC-13 | `PENDING TARGET` | [phase 05](phase-05.md), [phase 13](phase-13.md) | IPv4-first local policy exists; target WAN run is absent. |
| ARC-14 | `IMPLEMENTED` | [phase 01](phase-01.md), [phase 15](phase-15.md) | Structured redacted diagnostics and scanner are present. |
| ARC-15 | `BLOCKED` | [phase 02](phase-02.md) | Separate specification-use/distribution authorization is unresolved. |

Count: 42 mandatory aliases reconciled (12 `OBJ`, 10 `SAFE`, 5 `PAIR`, 15 `ARC`).

## HAP acceptance traceability

| ID | Result | Evidence | Final note |
|---|---|---|---|
| HAP-001 | `PASS` | [phase 05](phase-05.md) | Live Android browse, local endpoint resolution, removal, and reappearance are recorded; pairing was not run. |
| HAP-002 | `PENDING TARGET` | [phase 05](phase-05.md) | No physical duplicate/address-change record. |
| HAP-003 | `PENDING TARGET` | [phase 07](phase-07.md) | Full simulated transcript passes; ownership conditions and target pairing are absent. |
| HAP-004 | `PENDING TARGET` | [phase 08](phase-08.md) | Simulated persisted-record verification passes; physical cold launch absent. |
| HAP-005 | `PENDING TARGET` | [phase 08](phase-08.md), [phase 16](phase-16.md) | Twenty-cycle socket, latency, and memory run not performed. |
| HAP-006 | `PENDING TARGET` | [phase 09](phase-09.md) | Physical HAP service and characteristic enumeration absent. |
| HAP-007 | `PENDING TARGET` | [phase 09](phase-09.md) | Current-temperature metadata/read trace absent. |
| HAP-008 | `PENDING TARGET` | [phase 10](phase-10.md) | Safe command logic passes fakes; target capability and read-back absent. |
| HAP-009 | `PASS` | [phase 10](phase-10.md), [phase 14](phase-14.md) | Possible-send path is ambiguous, reconciled, and never replayed. |
| HAP-010 | `PENDING TARGET` | [phase 11](phase-11.md) | Target event reliability and traffic/staleness measurement absent. |
| HAP-011 | `PENDING TARGET` | [phase 12](phase-12.md) | Physical Wi-Fi, restart, refusal, and address-change matrix absent. |
| HAP-012 | `PENDING TARGET` | [phase 13](phase-13.md) | WAN-denied cold-start control was not run. |
| HAP-013 | `PENDING TARGET` | [phase 13](phase-13.md) | Independent router/packet proof was not run. |
| HAP-014 | `PASS` | [phase 15](phase-15.md) | Static source, UI, fixture, committed-evidence, logger, and scanner audit passes; device backup audit remains a separate pending security check. |
| HAP-015 | `PASS` | [phase 14](phase-14.md) | Deterministic credential, endpoint, pairing, session, and write failure paths pass. |
| HAP-016 | `FAIL` | [phase 04](phase-04.md) | Initial Android Hermes gate failed on the current SRP/Node-crypto path; the bounded remediation rerun reported `7 passed · 0 failed` but is not promoted. |
| HAP-017 | `BLOCKED` | [phase 02](phase-02.md) | Distribution-authority owner/decision is external to this implementation run. |

Count: 17 acceptance criteria reconciled.

## Target capability observations

| Capability | HAP-exposed | Read verified | Write verified | Event verified | Notes |
|---|---|---|---|---|---|
| Current temperature | `TBD` | `PENDING TARGET` | N/A | `PENDING TARGET` | Required; no target present. |
| Target temperature | `TBD` | `PENDING TARGET` | `PENDING TARGET` | `PENDING TARGET` | Required write representation is unknown. |
| Current relative humidity | `TBD` | `PENDING TARGET` | N/A | `PENDING TARGET` | Optional. |
| Target HVAC mode | `TBD` | `PENDING TARGET` | `PENDING TARGET` | `PENDING TARGET` | Optional. |
| Current operating state | `TBD` | `PENDING TARGET` | N/A | `PENDING TARGET` | Optional. |
| Temperature display units | `TBD` | `PENDING TARGET` | `PENDING TARGET` | `PENDING TARGET` | Optional; not inferred from locale. |
| Heating threshold | `TBD` | `PENDING TARGET` | `PENDING TARGET` | `PENDING TARGET` | Characterize if exposed. |
| Cooling threshold | `TBD` | `PENDING TARGET` | `PENDING TARGET` | `PENDING TARGET` | Characterize if exposed. |

## Resilience matrix

| Scenario | Result | Evidence/limitation |
|---|---|---|
| App force-stop and cold launch | `PENDING TARGET` | [phase 08](phase-08.md); physical trace absent. |
| Brief background/foreground | `PENDING TARGET` | [phase 12](phase-12.md); physical trace absent. |
| Phone Wi-Fi off/on | `PENDING TARGET` | [phase 12](phase-12.md); physical trace absent. |
| Access point change | `PENDING TARGET` | [phase 12](phase-12.md); physical trace absent. |
| Thermostat TCP refusal | `PENDING TARGET` | Deterministic bounded retry passes; target timing absent. |
| Thermostat restart | `PENDING TARGET` | [phase 12](phase-12.md); physical trace absent. |
| DHCP address change | `PENDING TARGET` | Policy/coordinator tests pass; target trace absent. |
| Drop before write transmission | `PASS` | Deterministic definite-failure semantics are covered by the command model. |
| Drop after possible transmission | `PASS` | [phase 10](phase-10.md); no replay and read-back reconciliation pass. |
| Corrupt local credential record | `PASS` | [phase 14](phase-14.md); repair-required state is retained. |
| Accessory removes controller pairing | `PENDING TARGET` | Cleanup state handling exists; target operation absent. |

## Security, privacy, and maintenance checks

| Check | Result | Evidence/limitation |
|---|---|---|
| Source and evidence secret scan | `PASS` | [phase 15](phase-15.md); sanitized evidence scanner is clean. |
| Android backup/data-transfer inspection | `PENDING TARGET` | Configuration disables backup, but device inspection was unavailable. |
| Protected data absent from ordinary app storage | `PASS` | [phase 03](phase-03.md); no general storage adapter is used. |
| Arbitrary destination rejection | `PASS` | [phase 14](phase-14.md); public, loopback, unspecified, and off-interface cases pass. |
| No arbitrary host/port or characteristic console | `PASS` | [phase 01](phase-01.md), [phase 06](phase-06.md). |
| Release-like protocol logging audit | `PASS` | [phase 01](phase-01.md), [phase 15](phase-15.md); no payload logger exists. |
| Accessory removal/local deletion distinction | `PASS` | [phase 15](phase-15.md). |
| Existing-association restoration | `PENDING TARGET` | No association was changed in this run. |
| Dependency/license inventory | `PASS` | [phase 02](phase-02.md); versions, notices, and provenance are recorded. |
| Dependency vulnerability audit | `FAIL` | [phase 02](phase-02.md); 11 moderate transitive vulnerabilities remain, with only a breaking forced fix suggested. |
| HAP specification-use/distribution review | `BLOCKED` | [phase 02](phase-02.md); requires external authority. |

## WAN-denial procedure

Result: `PENDING TARGET`, with milestone M2 recorded as `BLOCKED` because the target and independent router/firewall evidence were unavailable. The application contains no cloud or bridge path in the spike, but code inspection cannot prove the end-to-end WAN-denied operation.

Required follow-up is the documented baseline, scoped WAN rule, independent denial proof, force-stop, cold launch, Pair Verify, read, safe write, thermostat restart, and repeated observation/control sequence.

## Reliability gate

Result: `BLOCKED`. The required eight-hour foreground run, scheduled health-read denominator, hourly approved writes with restoration, interruptions, WAN denial, and resource trend measurements were not performed. M3 therefore cannot pass.

## Milestones

| Milestone | Result | Reason |
|---|---|---|
| M1 — Protocol feasibility | `BLOCKED` | HAP-016 remains recorded `FAIL`; pairing, cold verification, and target reads remain unvalidated. |
| M2 — Local control | `BLOCKED` | M1 and the WAN-denied target procedure are not closed. |
| M3 — Dependability | `BLOCKED` | M2 and the reliability run are not closed. |

## Final decision

`NO-GO` for the current run. The charter allows GO only after M3 and all required critical criteria pass, and allows CONDITIONAL GO only after the end-to-end path works with a bounded residual issue. Neither condition is met because the initial HAP-016 gate remains recorded `FAIL`, pairing and later target gates remain unvalidated, and HAP-017 has an unresolved external governance decision. The remediation rerun's `7 passed · 0 failed` result is preserved as unpromoted evidence.

This decision stops production integration. It does not authorize root-app changes, and it does not prohibit a later target run using the isolated spike.
