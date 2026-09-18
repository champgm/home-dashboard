# Ecobee HAP POC — Phase 02 Evidence

## Status

`PARTIAL`: provider selection and source provenance are complete; the dependency audit reports transitive vulnerabilities and distribution-authority review remains blocked.

## Scope and traceability

- Primary: `ARC-04`, `ARC-15`.
- Supporting: `ARC-03`, `ARC-06`, `ARC-07`.
- Acceptance: `HAP-017` is `BLOCKED` pending a separate authorization decision for HAP specification use and distribution.

## Evidence

- `spikes/ecobee-hap-poc/docs/HAP_SOURCE_DECISION.md` records the selected upstream provenance, pinned revision, license, and the narrow adapters carried into the spike.
- The implementation uses the selected SRP adapter, sodium-backed primitive provider, DNS-SD adapter, NetInfo Wi-Fi snapshot adapter, TCP adapter, and secure storage adapter; it does not pull a full opaque HAP runtime into the root app.
- `spikes/ecobee-hap-poc/docs/THIRD_PARTY_NOTICES.md` records the dependency inventory and license review inputs.
- `spikes/ecobee-hap-poc/docs/UPSTREAM_UPDATE_PROCEDURE.md` defines review, pin update, vector rerun, and evidence refresh steps.
- The remaining governance question is explicitly recorded rather than treated as an implementation assumption.
- The completed production-dependency audit reports 11 moderate transitive vulnerabilities after adding the documented React Native crypto fallback. The suggested forced remediation would downgrade Expo to a breaking version, so no automatic dependency mutation was applied.

## Verification

```text
python3 docs/ecobee-hap-poc/implementation_plan/validate_plan.py -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck                 -> PASS
npm --prefix spikes/ecobee-hap-poc run audit:dependencies        -> FAIL (11 moderate transitive vulnerabilities; forced fix is breaking)
```
