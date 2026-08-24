# Phase 02 — Hue Provisioning Protocol Correctness

Before implementation, read:

- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_IMPLEMENTATION_PLAN.md`
- `docs/implementation_plan/ui-provisioning-remediation-2.2.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.2.0.yaml`
- `docs/SAD_2.2.0.yaml`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-01.md`

## Objective

Make Hue initial provisioning issue the correct unauthenticated Hue V1 create-user request at the API root and prove the request/response behavior with transport-level tests.

## Why this phase exists

The current `HueV1Adapter.provision()` calls `requestUnauthenticated("/config", "POST", ...)`, which constructs `/api/config` and is rejected immediately. Protocol correctness should be fixed and tested before changing diagnostics/UI.

## Authoritative requirements

- `HUE-002` — PRIMARY
- `HUE-013` — PRIMARY
- `HUE-012` — supporting
- `REL-001`, `REL-002` — supporting
- `QA-003` — supporting

## Relevant SAD sections

- `hue_v1_design.provisioning`
- `internal_domain_interfaces.services.HueV1Adapter`
- `failure_and_deadline_architecture`
- `security_architecture`
- `verification_architecture`

## In scope

- Add an explicit transport capability for unauthenticated Hue API-root requests so create-user produces exactly `http://<bridge-ip>/api`.
- Change `HueV1Adapter.provision()` to use the API-root operation.
- Preserve existing timeout behavior and response classification.
- Add deterministic tests for:
  - exact method/path/body;
  - link-button-not-pressed Hue error response;
  - successful username extraction;
  - malformed/non-success envelopes;
  - no accidental `/api/config` create-user request.

## Explicitly out of scope

- Provisioning screen copy/layout.
- Advanced diagnostics aggregation.
- Live bridge test; may remain `PENDING TARGET` until Phase 08.
- Reauthorization behavior unless a shared transport helper requires regression tests.

## Expected repository changes

### Existing prerequisites

- `src/protocol/hue/HueV1Adapter.ts`
- `src/protocol/hue/httpTransport.ts`
- `src/protocol/hue/resultClassifier.ts`
- `test/protocol/hue/`

### Expected outputs

- updated `src/protocol/hue/HueV1Adapter.ts`
- updated `src/protocol/hue/httpTransport.ts` if needed for an exact API-root operation
- `test/protocol/hue/provisioning/provisioningTransport.test.ts`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-02.md`

## Required implementation behavior

- Create-user request: `POST /api` with JSON `{ "devicetype": "home-dashboard" }` or the exact 2.2.0 SAD-selected value.
- No credential is present in this request path.
- Hue error type 101/link-button-not-pressed is a definite protocol rejection, not network failure.
- A success envelope lacking a username is not success.
- No automatic create-user retry is added.
- Do not weaken credential redaction.

## Tests

Write transport/adapter tests together with the fix. Use an injected fake `HueHttpClient` and assert the complete requested URL.

## Acceptance focus

- `AC-HUE-002` — local protocol portion **ADVANCED/PARTIAL**; live bridge closes in Phase 08.
- `AC-HUE-013` — complete for provisioning response classification.

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/provisioning test/protocol/hue/core/resultClassifier.test.ts
npm run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-02.md`.

## Exit criteria

- [ ] Create-user URL is exactly the 2.2.0 Hue interface contract.
- [ ] `/api/config` is regression-tested as incorrect for provisioning.
- [ ] Error/success envelopes are covered.
- [ ] Full local test suite passes.
- [ ] Live Hue check is either passed or recorded `PENDING TARGET` for Phase 08.
- [ ] Evidence is committed.
