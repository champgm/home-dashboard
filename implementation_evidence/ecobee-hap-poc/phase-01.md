# Ecobee HAP POC — Phase 01 Evidence

## Status

`COMPLETE` for the isolated foundation and diagnostics scope. No target-dependent acceptance criterion is claimed here.

## Scope and traceability

- Primary: `SAFE-01`, `SAFE-02`, `SAFE-04`, `ARC-01`, `ARC-02`, `ARC-14`.
- Supporting: `OBJ-12`.
- Output: `spikes/ecobee-hap-poc/`.

## Evidence

- The spike has its own Expo manifest, scripts, TypeScript configuration, test configuration, and Android application identity.
- Root application source, dependency manifests, lockfiles, and native surfaces were not changed by this implementation.
- The UI exposes only predefined discovery, pair, refresh, write, and cleanup actions. Setup input is masked; pairing, unpairing, and writes require an explicit confirmation step.
- The app shell mounts the crypto vector runner and a sanitized target-run sheet. The sheet persists and shares only allowlisted result categories and never accepts diagnostic text, target identifiers, credentials, or payloads.
- Structured diagnostics use an allowlist and reject unknown or sensitive fields. Evidence scanning rejects setup-code-shaped values, network identifiers, secret field names, and long opaque hex values.
- No credentials, household identifiers, live endpoint data, or target captures were committed.

## Verification

```text
npm --prefix spikes/ecobee-hap-poc run typecheck  -> PASS
npm --prefix spikes/ecobee-hap-poc run test:ci    -> PASS (30 suites, 64 tests)
```

The remaining acceptance work is intentionally deferred to later phases; this phase establishes the boundary and safe UI surface only.
