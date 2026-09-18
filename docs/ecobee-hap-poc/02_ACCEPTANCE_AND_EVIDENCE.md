# Ecobee Local HAP Controller — POC Acceptance and Evidence

**Status:** Test contract and evidence template  
**Related documents:** `00_POC_CHARTER.md`, `01_TECHNICAL_DESIGN.md`

## Result vocabulary

Every criterion must use one of these results:

- `PASS` — exercised as written with recorded evidence.
- `FAIL` — exercised and did not meet the criterion.
- `PENDING TARGET` — implementation or fixture exists, but the required physical target/environment was unavailable.
- `BLOCKED` — a named external prerequisite prevented execution; include the owner and unblock condition.
- `NOT SUPPORTED BY TARGET` — the representative thermostat does not expose the capability; include enumeration evidence.
- `NOT RUN` — no valid evidence exists.

Mock, emulator, desktop Node.js, and unit-test results cannot satisfy a physical-target criterion.

## Evidence location and hygiene

Create the eventual run record at:

```text
implementation_evidence/ecobee-hap-poc/RESULTS.md
```

Store only sanitized supporting artifacts beside it. Do not commit setup codes, pairing records, stable accessory identifiers, household network identifiers, IP/MAC addresses, private keys, session material, or packet payloads containing secrets. Hash or replace stable identifiers consistently when correlation is necessary.

For every test record:

- criterion ID and result
- UTC timestamp and tester
- app commit/build identifier
- sanitized target/environment identifier
- exact procedure
- expected and actual behavior
- artifact links or summarized observations
- defects/deviations
- rerun requirement

## Required target record

| Field | Value |
|---|---|
| ecobee model | `TBD` |
| thermostat firmware | `TBD` |
| HomeKit/HAP setup availability | `TBD` |
| pre-existing HomeKit pairings | `TBD` |
| pairing removal approved by | `TBD or N/A` |
| prior-association restoration procedure | `TBD or N/A` |
| phone model | `TBD` |
| Android version | `TBD` |
| Expo / React Native / Hermes versions | Expo 57 / RN 0.86 / `TBD` |
| Wi-Fi/AP topology | `TBD — sanitized` |
| client isolation/multicast policy | `TBD` |
| WAN-denial mechanism | `TBD` |
| packet/router evidence method | `TBD` |

## Critical acceptance matrix

All supported critical criteria must pass for GO. `NOT SUPPORTED BY TARGET` is acceptable only for the explicitly optional characteristic checks; it is a NO-GO for discovery, pairing, Pair Verify, current temperature, or a safe thermostat control write.

| ID | Criterion | Evidence | Result |
|---|---|---|---|
| HAP-001 | A physical Android target discovers the thermostat via `_hap._tcp`, resolves a reachable LAN endpoint, and detects browse removal/reappearance. | Sanitized live discovery record in Phase 05 evidence | `PASS` |
| HAP-002 | Repeated discovery does not create duplicate selectable accessories and an address change does not change paired identity. | Before/after address-change record | `NOT RUN` |
| HAP-003 | Under recorded and approved pairing-ownership conditions, Pair Setup succeeds from an explicit operator action using the setup code, with no secret appearing in logs or persisted general storage. | Pairing-state precondition, approval if required, sanitized phase trace, and storage/log audit | `NOT RUN` |
| HAP-004 | After force-stop and cold launch, persisted credentials complete Pair Verify without setup-code entry or Pair Setup. | Cold-launch trace | `NOT RUN` |
| HAP-005 | Twenty consecutive fresh TCP connection and Pair Verify cycles succeed without re-pairing; every prior socket reaches its terminal closed state, concurrent open sockets return to the designed idle count after each cycle, and memory/latency show no monotonic growth beyond a recorded measurement tolerance. | Cycle table with latency, socket-state/count, and available memory observations; document platform measurement limits | `NOT RUN` |
| HAP-006 | Accessory enumeration identifies the thermostat service and current-temperature characteristic using HAP types and instance IDs rather than display names. | Sanitized capability summary | `NOT RUN` |
| HAP-007 | The app reads current temperature with correct format, constraints, and units; optional target, humidity, mode, and operating-state support is recorded separately. | Typed read results and metadata summary | `NOT RUN` |
| HAP-008 | An operator-approved setpoint write using the target-temperature or applicable heating/cooling-threshold characteristic exposed by the thermostat is validated against current mode and characteristic metadata, transmitted, and confirmed by authoritative read-back or event. | Capability selection plus before/write/after state trace | `NOT RUN` |
| HAP-009 | A connection loss after possible write transmission is classified as ambiguous and is reconciled by read-back without automatic replay. | Injected-fault trace | `NOT RUN` |
| HAP-010 | Foreground event subscriptions deliver changes reliably, or the evidence establishes a bounded polling fallback with measured staleness and traffic. | Event/poll observations and decision | `NOT RUN` |
| HAP-011 | The app recovers without re-pairing after phone Wi-Fi reconnect, app background/foreground, thermostat TCP refusal/restart, and thermostat IP change. | Fault matrix with recovery times | `NOT RUN` |
| HAP-012 | From a cold app start, discovery/resolve or paired-device resolution, Pair Verify, read, and safe write succeed while thermostat WAN is denied. | Router/firewall proof plus sanitized operation trace | `NOT RUN` |
| HAP-013 | Independent observation finds no thermostat Internet flow required for the successful HAP control sequence and no app cloud dependency in the POC path. | Sanitized packet/router summary and code/config audit | `NOT RUN` |
| HAP-014 | Setup code, long-lived private keys, pairing records, session material, and stable household identifiers are absent from logs, error UI, fixtures, and committed evidence. | Secret-scan and manual audit results | `NOT RUN` |
| HAP-015 | Missing/corrupt credential records, accessory rejection, wrong setup code, and stale discovery endpoints fail explicitly without credential deletion loops or uncontrolled Pair Setup retries. | Negative-test table | `NOT RUN` |
| HAP-016 | Each required cryptographic primitive and composed handshake passes retained known-answer/upstream vectors on Hermes and the physical Android build. | Vector suite results and provider/version inventory | `NOT RUN` |
| HAP-017 | Notices record exact third-party versions/commits and licenses; HAP specification-use terms and any authorization/certification implications for intended distribution are reviewed separately; and the result establishes a supportable update and vulnerability-response path. | Dependency/license review plus specification-use/distribution decision | `NOT RUN` |

## Capability observations

Record each characteristic exposed by the target rather than assuming ecobee cloud features map to HAP.

| Capability | HAP-exposed | Read verified | Write verified | Event verified | Notes |
|---|---:|---:|---:|---:|---|
| Current temperature | `TBD` | `TBD` | N/A | `TBD` | Required |
| Target temperature | `TBD` | `TBD` | `TBD` | `TBD` | Required write path, possibly represented through heating/cooling thresholds instead |
| Current relative humidity | `TBD` | `TBD` | N/A | `TBD` | Optional |
| Target HVAC mode | `TBD` | `TBD` | `TBD` | `TBD` | Optional for POC; characterize constraints |
| Current operating state | `TBD` | `TBD` | N/A | `TBD` | Optional |
| Temperature display units | `TBD` | `TBD` | `TBD` | `TBD` | Optional; do not infer from locale |
| Heating threshold | `TBD` | `TBD` | `TBD` | `TBD` | Characterize if exposed |
| Cooling threshold | `TBD` | `TBD` | `TBD` | `TBD` | Characterize if exposed |

## Resilience matrix

For each scenario, record detection time, recovery time, user action, whether Pair Verify was repeated, whether subscriptions were restored, and whether state was refreshed.

| Scenario | Expected behavior | Result |
|---|---|---|
| App force-stop and cold launch | Load valid credentials, rediscover/resolve, Pair Verify, refresh | `NOT RUN` |
| Brief background/foreground | No stale session use; reconnect/refresh as designed | `NOT RUN` |
| Phone Wi-Fi off/on | Report offline, then rediscover and recover without re-pair | `NOT RUN` |
| Access point change within test LAN | Bind discovery/session to the active interface and recover safely | `NOT RUN` |
| Thermostat TCP refusal | Bounded backoff and actionable state, no Pair Setup | `NOT RUN` |
| Thermostat restart | Re-resolve, Pair Verify, restore observation, refresh | `NOT RUN` |
| DHCP address change | Follow accessory identity through discovery, reject stale endpoint | `NOT RUN` |
| Drop before write transmission | Definite failure where provable; no state claim | `NOT RUN` |
| Drop after possible transmission | Ambiguous result, no replay, authoritative read-back | `NOT RUN` |
| Corrupt local pairing record | Repair-required state; no crash or automatic destructive action | `NOT RUN` |
| Accessory removed controller pairing | Explain repair path; retain record until operator chooses action | `NOT RUN` |

## Reliability run

After individual criteria pass, run a foreground soak test on the physical target:

- duration: at least 8 hours;
- observation policy: keep the selected production-candidate event/poll policy active;
- reliability denominator: issue one explicit current-temperature health read every minute regardless of the observation policy, yielding at least 480 scheduled probes across the single 8-hour run before permitted interruption-window exclusions;
- safe write cadence: at least one operator-approved change per hour, with restoration and read-back;
- forced interruptions: at least two app background/foreground cycles and one phone Wi-Fi reconnect;
- WAN state: thermostat WAN denied for the entire run;
- success target: no re-pair, no crash, no unreconciled ambiguous write, and at least 99% successful scheduled health reads excluding only predeclared, timestamped interruption windows.

Record the probe denominator and failures, memory trend, open-session/socket trend if observable, command latency distribution, reconnect counts, stale-value windows, and every error category. Do not restart the soak clock merely to discard an unexplained failure; resolve the defect and identify a new run explicitly. The threshold is a POC gate, not a production service-level objective.

## Milestone evidence summary

Record milestone outcomes before the final decision. A later milestone may not erase a failed prerequisite.

| Milestone | Minimum evidence | Result |
|---|---|---|
| M1 — Protocol feasibility | HAP-001, HAP-003, HAP-004, HAP-006, HAP-007, HAP-016 | `NOT RUN` |
| M2 — Local control | M1 plus HAP-008, HAP-009, HAP-011, HAP-012, HAP-013 | `NOT RUN` |
| M3 — Dependability | M2 plus all remaining critical criteria and the reliability run | `NOT RUN` |

## Security and privacy checks

- Search source and artifacts for the real setup code and known test keys.
- Inspect Android backup/data-transfer behavior for secure credentials.
- Verify pairing data is not placed in AsyncStorage, source, build configuration, clipboard, crash messages, or analytics.
- Attempt public, loopback, unspecified, stale, and unrelated-interface destinations and verify rejection.
- Verify the app offers no arbitrary host/port, raw request, or arbitrary characteristic write facility.
- Confirm release-like builds do not enable protocol payload logging.
- Document removal behavior for local controller credentials and, separately, the accessory's paired-controller entry.
- If an existing Apple Home association was removed, verify the approved restoration procedure without factory-resetting HVAC configuration and record the outcome.

## WAN-denial procedure

1. Establish baseline LAN discovery and control with normal routing.
2. Apply a router/firewall rule scoped to the thermostat that denies Internet/WAN traffic while preserving same-LAN unicast and multicast.
3. Verify the denial independently using router/firewall counters or a sanitized packet observation; do not rely only on the thermostat UI.
4. Force-stop the POC and allow any earlier TCP session to expire.
5. Cold-launch the POC.
6. Discover or resolve the paired thermostat, complete Pair Verify, enumerate/refresh, read current state, perform one safe write, and confirm it.
7. Restart the thermostat with the WAN rule still active and repeat connection, read, and safe write.
8. Leave the rule active for the reliability run.
9. Record any thermostat degradation unrelated to HAP control, such as missing weather or remote-service warnings, separately from LAN-control results.

## Decision record template

```markdown
## POC decision

- Decision: GO | CONDITIONAL GO | NO-GO
- Date:
- Reviewers:
- Target model/firmware:
- App commit/build:

### Critical result summary

- M1 protocol feasibility:
- M2 local control:
- M3 dependability:
- Passed:
- Failed:
- Pending/blocked:
- Target capabilities not exposed:

### Dependability findings

- Pair/verify reliability:
- Lifecycle and reconnect behavior:
- Event or polling decision:
- WAN-denied behavior:
- Soak-test result:

### Security and maintenance findings

- Credential handling:
- Crypto qualification:
- Dependency/license posture:
- Required fork/adaptation surface:

### Conditions or blockers

- Item / owner / due date / required evidence:

### Recommended next action

- SRS/SAD revision scope, bounded follow-up experiment, or stop rationale:
```

## GO review checklist

- [ ] Every critical criterion has a defensible result.
- [ ] HAP-001 through HAP-009 and HAP-011 through HAP-017 are `PASS`.
- [ ] HAP-010 is `PASS` with an explicit event-versus-polling decision.
- [ ] The reliability run passes with thermostat WAN denied.
- [ ] No unresolved high-severity security, pairing-state, or ambiguous-write defect remains.
- [ ] The exact dependency/fork surface and license obligations are recorded.
- [ ] Limitations of the tested model, firmware, Android version, and network are explicit.
- [ ] A GO recommendation identifies the required SRS/SAD changes before production code begins.
