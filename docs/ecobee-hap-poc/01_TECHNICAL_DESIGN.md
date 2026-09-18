# Ecobee Local HAP Controller — POC Technical Design

**Status:** Proposed, non-authoritative  
**Related charter:** `00_POC_CHARTER.md`

## Design intent

Prove the smallest end-to-end HAP controller that is representative of a future Home Dashboard integration. The POC favors narrow interfaces, protocol testability, and observable failure semantics over UI completeness.

This design does not authorize production changes. In particular, it does not override the mDNS restriction in `SAD_2.4.1.yaml`.

## System boundary

```text
Operator
   |
Minimal POC UI
   |
Thermostat use cases
   |
HAP controller core
   |-------- credential store adapter ------ Android secure storage
   |-------- discovery adapter ------------- Android DNS-SD/mDNS
   |-------- crypto adapter ---------------- reviewed crypto providers
   `-------- TCP adapter ------------------- local Wi-Fi -------- ecobee HAP service
                                                                  (WAN denied in gate test)
```

No cloud API, Home Assistant instance, HomeKit hub, or application backend belongs inside this boundary.

## Repository and build structure

The later implementation should be a self-contained Expo development-build application:

```text
spikes/ecobee-hap-poc/
  app.json
  package.json
  tsconfig.json
  App.tsx
  src/
    application/
    hap/
      core/
      transport/
      discovery/
      crypto/
      credentials/
    ui/
  test/
    unit/
    integration/
    vectors/
```

The POC may use an Expo config plugin or generated Android project when a dependency requires native configuration. It must not modify the root application's dependency graph or Android manifest.

## Component responsibilities

### Minimal POC UI

- Start and stop discovery.
- Select one discovered thermostat.
- Accept a setup code through a masked input without persisting it.
- Initiate pairing only after explicit confirmation.
- Show sanitized connection and protocol state.
- Show discovered thermostat capabilities and values.
- Issue only predefined, bounded thermostat commands.
- Offer an explicit unpair operation with a consequence warning.
- Export or copy a sanitized evidence summary, never secrets.

### Thermostat application service

- Convert generic HAP accessories and characteristics into a small thermostat capability model.
- Keep unsupported or absent characteristics distinguishable from transport failure.
- Apply value constraints and unit conversion from characteristic metadata.
- Perform write followed by authoritative read-back.
- Classify outcomes as confirmed success, definite failure, ambiguous, or unsupported.
- Own reconnect and refresh policy without depending on rendered screens.

### HAP controller core

- Implement or adapt IP HAP Pair Setup, Pair Verify, encrypted framing, accessory enumeration, characteristic reads/writes, and event subscriptions.
- Contain no React Native UI imports.
- Depend only on the adapter interfaces below.
- Preserve upstream protocol tests and add interoperability regressions.
- Exclude Bluetooth HAP and accessory/server behavior.

`hap-controller` is the initial reference implementation candidate, not an accepted drop-in dependency. Before code is copied or forked, record the exact upstream version/commit, review its license obligations, inventory transitive behavior, and define how security or protocol fixes will be tracked. Avoid private deep imports that make upstream updates unreviewable.

The review must separately record the terms under which the HAP specification is being used and whether the intended post-POC distribution would require Apple authorization, certification, or program membership. An acceptable package license does not answer that separate question. The POC must not represent noncommercial specification access as production distribution approval.

### Discovery adapter

- Browse DNS-SD for `_hap._tcp` on the active Wi-Fi LAN.
- Provide service instance name, resolved local addresses, port, interface, and required HAP TXT fields.
- Promote only records whose HAP accessory category is `ci=9` (Thermostat); ignore known non-thermostat categories and fail closed for missing, malformed, or unknown categories.
- Deduplicate repeated browse/resolve events.
- Detect removal, address change, and interface change.
- Avoid indefinite browsing when the app is backgrounded.
- Never select an accessory solely by mutable display name after pairing; use its paired HAP accessory identity.

The first native candidate to evaluate is `@inthepocket/react-native-service-discovery`. Dependency selection remains provisional until it works in the exact Expo/RN/Android target.

### TCP adapter

- Wrap the root application's already-proven `react-native-tcp-socket` provider behind a smaller interface.
- Support connect, bounded read/write, close, error, and cancellation semantics required by HAP.
- Preserve byte boundaries correctly while allowing HAP's HTTP and encrypted-record parsers to handle arbitrary TCP fragmentation/coalescing.
- Never infer that socket write completion means the thermostat applied a characteristic write.

### Crypto adapter

Provide only the primitives required by IP HAP, including secure random bytes, hashes/HMAC/HKDF, SRP operations used by Pair Setup, Curve25519 key agreement, Ed25519 signatures, and ChaCha20-Poly1305 authenticated encryption in the exact modes required by the protocol.

Candidate providers must be evaluated against exact operations, not package-level claims of “Node crypto compatibility.” `react-native-quick-crypto`, a narrowly used audited implementation such as TweetNaCl, and any retained upstream implementation are candidates. Every primitive and composed handshake must pass known-answer or upstream vector tests on Hermes and on the physical Android target.

No insecure randomness, algorithm substitution, hand-written primitive, or silent pure-JavaScript fallback is permitted.

### Credential store adapter

- Store a versioned controller identity and per-accessory pairing record in `expo-secure-store`.
- Keep the setup code and session keys memory-only and clear references as soon as practical.
- Detect missing, corrupt, partial, or schema-incompatible records explicitly.
- Serialize pairing-state updates so interrupted writes cannot be mistaken for valid credentials.
- Do not automatically discard a record when Pair Verify fails; report a repair state and require operator action.
- Keep POC storage names separate from any future production namespace.

The POC controller identity is disposable. A production design must explicitly choose whether to re-pair or implement a reviewed credential migration; migration is not part of this experiment.

## Connection and state model

The observable state machine should distinguish at least:

```text
idle -> discovering -> selected
selected -> pairing -> paired
paired -> verifying -> ready
ready -> reconnecting -> verifying -> ready

pairing/verifying/reconnecting -> recoverable error
pairing -> authentication failure
paired/verifying -> pairing repair required
```

Events from an older discovery generation, TCP connection, or app lifecycle epoch must not update the current state. Only one Pair Setup or Pair Verify operation may be active for the selected accessory.

## Pairing flow

1. Browse and resolve the operator-selected HAP service.
2. Inspect and record its advertised pairing state without assuming that possession of a setup code makes it available for Pair Setup.
3. If it has an existing HomeKit association, stop until the operator approves a documented association-removal and restoration procedure.
4. Validate the resolved endpoint as local and retain the advertised accessory identity.
5. Prompt for the setup code only when the operator begins Pair Setup.
6. Complete Pair Setup and validate every authenticated transcript step.
7. Persist the finalized pairing record only after the accessory confirms success.
8. Close the setup connection.
9. Establish a fresh connection and complete Pair Verify from the persisted record.
10. Fetch the accessory database and build the capability model.

If pairing succeeds at the accessory but local persistence fails, report an indeterminate/repair condition. Do not blindly retry Pair Setup. The evidence must capture how the accessory and controller are safely returned to a known state.

POC cleanup must treat accessory-side pairing removal and deletion of the local credential record as separate, explicit operations. If the POC displaced an earlier Apple Home association, follow the approved restoration procedure after removing the POC controller. Do not factory-reset the thermostat or change HVAC equipment configuration as an incidental pairing-recovery step.

## Normal session and commands

- Pair Verify precedes all protected operations after a new TCP connection.
- Accessory enumeration is cached only for the session during the POC; reconnect may fetch it again.
- Characteristic identity uses accessory instance ID plus characteristic instance ID, not display text.
- Each displayed value records freshness and source (initial read, event, or reconciliation read).
- A command selects the writable setpoint representation actually exposed by the accessory—target temperature or the applicable heating/cooling threshold—and validates its permissions, format, range, step, current HVAC mode, and units.
- A write is not reported as confirmed until a subsequent value/event establishes the intended state.
- Timeout or disconnect after possible transmission produces an ambiguous result followed by read-back; it is never automatically retried.

## Events, polling, and lifecycle

The preferred path is an event subscription for characteristics that the accessory marks as event-capable. The POC must measure delivery through foreground use, brief backgrounding, reconnect, and thermostat restart.

If events are absent or unreliable, the POC may evaluate bounded foreground polling. It must record the chosen interval, traffic volume, battery implications, staleness, and whether polling is necessary after writes. Background continuous operation is out of scope.

On backgrounding, the POC may close its session. On return it must re-resolve the paired accessory if needed, perform Pair Verify, re-enumerate or validate the accessory database, restore subscriptions, and refresh authoritative state.

## Discovery and network policy

- Discovery is local-link only.
- Resolved addresses must belong to the active local network; public, loopback, unspecified, and unrelated-interface destinations are rejected.
- IPv4 is required for the first POC. IPv6 observations are recorded but not silently treated as production support.
- The accessory identity from discovery must match the paired record before protected operations proceed.
- IP address changes are handled by rediscovery, not by treating the old address as identity.
- Custom VPN routing, multicast relays, manual DNS, and router automation are outside the POC.

The WAN-denial gate must block only the thermostat's Internet access while retaining LAN reachability and local multicast. Phone Internet access may remain available, but packet/router evidence must show the control path terminates locally and succeeds with thermostat WAN denied.

## Logging and evidence

Use structured event names and monotonic durations. Permitted fields include operation class, phase, result classification, retry count, redacted accessory alias, address family, and error category.

Do not log setup codes, private/public key material, proofs, signatures, nonces, session keys, authorization headers, encrypted frames, full TXT records, stable device identifiers, IP/MAC addresses in committed evidence, or raw accessory payloads without sanitization.

A development-only secret scanner should check captured logs and committed fixtures for known test secrets and credential field names.

## Implementation stages

1. **Skeleton and adapters:** independent app, fake adapters, state model, redacted logging.
2. **Discovery:** physical-device browse/resolve/removal/address-change proof and advertised pairing-state observation.
3. **Crypto qualification:** known-answer vectors and exact-target execution.
4. **Pair Setup and storage:** approved ownership conditions, one explicit pair, restart, and corrupt/missing-store cases.
5. **Pair Verify and enumeration:** repeated fresh sessions and capability dump. Complete the charter's M1 decision.
6. **Thermostat reads/writes:** typed capability mapping, capability-appropriate safe write, and reconciliation.
7. **WAN-denied control gate:** repeat cold-start-to-control path with network evidence. Complete the charter's M2 decision.
8. **Events and resilience:** subscriptions/polling decision, lifecycle and fault recovery.
9. **Dependability and governance:** reliability run plus security, license, specification-use, and maintenance reviews. Complete M3.
10. **Final decision review:** complete the evidence matrix and issue GO, CONDITIONAL GO, or NO-GO.

Each stage must leave earlier automated tests runnable. Hardware-dependent work is recorded as `PENDING TARGET`, never inferred from mocks.

## Production implications if the POC passes

Before production integration, create new authoritative SRS and SAD revisions. At minimum they must decide:

- supported ecobee models, firmware assumptions, capabilities, and degraded behavior;
- the amendment to the current `DG-004` mDNS restriction;
- permissions and user-facing local-network disclosure;
- controller identity, secure storage, migration, unpairing, and recovery policy;
- discovery and address validation policy, including IPv6;
- lifecycle, event subscription, polling, freshness, and command reconciliation;
- support and update policy for forked/adapted HAP code and cryptography;
- navigation, configuration, thermostat UI, and shared-state boundaries;
- security, privacy, target-device, WAN-denied, and interoperability acceptance tests.
