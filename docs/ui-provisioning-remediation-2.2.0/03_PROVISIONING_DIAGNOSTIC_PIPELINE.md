# Phase 03 — Provisioning Diagnostic Preservation

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-02.md`

## Objective

Make Hue provisioning failures retain useful, credential-safe diagnostic detail from protocol/transport through `HueProvisioningService`, the provisioning screen, and the current diagnostics surface.

## Why this phase exists

The current service catches every `adapter.provision()` exception and replaces it with `ProtocolRejected: Hue did not authorize this application.` This destroys the very information needed to distinguish wrong route, timeout, malformed response, link-button rejection, authentication, and storage failure.

## Authoritative requirements

- `REL-006` — PRIMARY
- `SEC-002` — PRIMARY
- `REL-001` — supporting
- `HUE-017` — supporting
- `PRIV-002` — supporting
- `QA-003` — supporting

## Relevant SAD sections

- `logging_and_diagnostics`
- `failure_and_deadline_architecture`
- `hue_v1_design.provisioning`
- `security_architecture`
- `internal_domain_interfaces`

## In scope

- Preserve typed `HueTransportError` / `HueResponseError` information through provisioning.
- Extend `Diagnostic` only as permitted by SAD 2.2.0 for bounded safe fields, e.g. protocol error code/type and safe description.
- Keep `category`, `operation`, technical resource/endpoint identifier, elapsed time, HTTP status, and safe Hue error detail when available.
- Make `HueProvisioningScreen` show a short human-readable summary plus bounded technical detail or a local expandable detail section.
- Make provisioning outcome available to Advanced diagnostics using the existing application service/runtime boundary selected by the SAD; do not create a cloud logger or unrelated global subsystem.
- Clear the provisioning diagnostic after successful provisioning.

## Explicitly out of scope

- General Hue snapshot/plug diagnostic de-duplication (Phase 04).
- Safe-area changes.
- Tile styling.
- New retry behavior.

## Expected repository changes

### Existing prerequisites

- `src/app/HueProvisioningService.ts`
- `src/app/diagnostics.ts`
- `src/app/types.ts`
- `src/app/bootstrap.ts`
- `src/ui/screens/HueProvisioningScreen.tsx`
- `src/protocol/hue/HueV1Adapter.ts`
- `src/protocol/hue/httpTransport.ts`

### Expected outputs

- updated diagnostic mapping/types
- updated provisioning service/runtime/UI
- focused tests under `test/app/provisioning/` and/or `test/ui/provisioning/`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-03.md`

## Required implementation behavior

- Link-button-not-pressed must remain visibly distinguishable from network timeout/unreachable.
- Never include Hue username/credential or a credential-bearing URL/path in the UI, logs, test snapshots, or diagnostic object.
- Do not surface raw exception `.toString()` when it might contain a URL.
- Technical detail should be bounded: category, operation, endpoint identifier, elapsed ms, safe HTTP status, Hue error type/code, redacted/safe description.
- Storage failures remain storage failures; do not relabel them Hue authorization failures.

## Tests

Inject at least:

- network unavailable;
- timeout;
- Hue link-button rejection;
- malformed Hue JSON/response;
- successful create-user followed by `/config` verification failure;
- protected-store write failure;
- synthetic credential-bearing exception text and verify redaction.

## Acceptance focus

- `AC-REL-006`
- `AC-SEC-002`
- `AC-HUE-002` diagnostic slice

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/app/provisioning test/ui/provisioning test/protocol/hue
npm run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-03.md`, including sample safe diagnostic objects from tests.

## Exit criteria

- [ ] Provisioning no longer collapses all failures to one generic message.
- [ ] Link-button, timeout, network, malformed, authentication, and storage classes are distinguishable.
- [ ] Credential leakage tests pass.
- [ ] Provisioning success clears its diagnostic.
- [ ] Evidence is complete.
