# Phase 08 — TP-Link Information and Energy

## Objective

Expose the required plug identity, status, feature, and capability-gated energy information already available from or discoverable through the adapter.

## Ownership

- Primary closure: `NC-TPL-001`, `NC-TPL-002`
- Requirements: `TPL-005`, `TPL-008`
- Dependencies: phase 01; may proceed alongside phases 02–07 but closes before phase 10

## Work

1. Extend the application service/view model to carry model, device identifiers, MAC, signal strength, relay state, feature/capability data, and other SRS-required plug information to the UI.
2. Initialize displayed name from the physical device alias where available while preserving the app’s explicit local naming semantics.
3. Request energy data only when the discovered model/capability supports it; normalize units without losing source precision.
4. Present current power and required accumulated/voltage/current fields where supported, with clear unavailable/unsupported states.
5. Do not style an unreachable plug’s IP address as if the IP itself were an error. Apply reachability/error treatment to the device/status context and preserve legibility.
6. Preserve bounded LAN-only discovery/control and existing credential/privacy constraints.

## Verification

- Parser/service tests cover representative HS100/HS110 and supported variants, missing fields, malformed responses, unreachable devices, and capability discovery.
- UI tests cover identity/status layout, alias initialization, energy-capable and non-energy-capable plugs, unavailable data, and accessible contrast.
- Integration tests prove energy is requested for capable models and skipped without error for unsupported models.
- Run the common quality gate.

## Exit criteria

- All required plug information reaches the UI and is legible in reachable/unreachable states.
- Energy data is retrieved and displayed where supported, and absence is non-fatal elsewhere.
- `NC-TPL-001` and `NC-TPL-002` are closed with focused evidence.
