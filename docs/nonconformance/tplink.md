# TP-Link Nonconformance

Current disposition: `NC-TPL-001` and `NC-TPL-002` have implementation and fixture/UI evidence in [rectification phase 08](../../implementation_evidence/nonconformance_rectification_plan/phase-08.md), but Phase 08 remains verification-incomplete until representative HS100/HS103/HS110 model acceptance is executed.

## `NC-TPL-001` — Required plug information is not displayed

Severity: **High**  
Requirement: `TPL-005`  
Status: **IMPLEMENTATION VERIFIED — TARGET MODEL VERIFICATION PENDING**

`mapSysInfo` parses alias, model, device ID, hardware/software versions, MAC, RSSI/signal, relay state, feature indicators, and energy capability. The application service stores that object, but the dashboard renders only alias (or the configured IPv4 before a successful read), and `PlugEditor` renders only endpoint plus alias input. No screen displays the other required returned information.

Required closure:

- add a Plug inspector showing each present characterized field without inventing absent values;
- initialize alias editing from the returned physical alias;
- test HS100/HS103/HS110 variations and target presentation.

## `NC-TPL-002` — Energy information is not integrated

Severity: **High**  
Requirement: `TPL-008`  
Status: **IMPLEMENTATION VERIFIED — TARGET MODEL VERIFICATION PENDING**

`TpLinkLegacyAdapter.getEnergy` and energy mapping exist, but `ApplicationService.refreshPlug` calls only `getSysInfo`. No UI calls `getEnergy`, and no UI renders current, voltage, power, total, today, or month values. Unsupported-emeter handling exists only at the adapter level.

Required closure:

- capability-gate an energy read for supported plugs;
- render only returned energy values;
- treat unsupported energy as absence, not an error;
- add service/UI tests and HS110/HS100/HS103 target acceptance.

## Other TP-Link disposition

Explicit private IPv4/port configuration, validation, stable overlay identity, local-only removal, relay/alias protocol operations, and malformed/error classification have local implementation/tests. Their remaining target acceptance is still unresolved and is recorded separately; this audit does not promote those items to target Pass.
