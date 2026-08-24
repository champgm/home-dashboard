# Phase 02 — Hue Provisioning Protocol Correctness

## Phase

- Phase: `02 — Hue Provisioning Protocol Correctness`
- Status: `COMPLETE`
- Commit/revision: `f1940d6` plus working-tree remediation changes
- Date: `2026-08-23`

## Work completed

- Added an explicit unauthenticated Hue API-root transport operation.
- Changed create-user provisioning from `/api/config` to exactly `POST /api`.
- Preserved Hue response classification and safe error descriptions, including link-button-not-pressed rejection.
- Added transport-level tests for request URL/method/body, success, link-button rejection, missing username, and malformed envelopes.

## Requirement IDs addressed

### Primary

- `HUE-002`
- `HUE-013`

### Supporting

- `HUE-012`, `REL-001`, `REL-002`, `QA-003`

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-HUE-002` | PARTIAL | Fake transport proves exact `POST /api`; live link-button rejection/success remains Phase 08 target work |
| `AC-HUE-013` | PASS | `test/protocol/hue/provisioning/provisioningTransport.test.ts` and existing classifier tests |

## Tests and checks executed

```text
npm run typecheck — PASS.
npm run test:ci -- test/protocol/hue/provisioning test/protocol/hue/core/resultClassifier.test.ts — PASS (2 suites, 6 tests).
```

## Files materially changed

- `src/protocol/hue/httpTransport.ts`
- `src/protocol/hue/HueV1Adapter.ts`
- `test/protocol/hue/provisioning/provisioningTransport.test.ts`
- `implementation_evidence/ui-provisioning-remediation-2.2.0/phase-02.md`

## Diagnostics / observability evidence

- Failure mode exercised: Hue link-button-not-pressed error type, missing username, malformed response, and successful username extraction.
- User-visible output: adapter retains the safe Hue rejection description for the diagnostic pipeline.
- Technical detail retained: Hue protocol rejection category and safe description; no raw URL is surfaced.
- Sensitive-data/redaction result: request path is unauthenticated `/api`; no credential can appear in the create-user URL.

## Visual evidence, if applicable

- Not applicable to this protocol phase.

## Known limitations

- Live Hue bridge link-button behavior remains target-gated for Phase 08.

## Target-dependent checks not yet performed

- `PENDING TARGET`: real bridge link-button-not-pressed and successful provisioning.

## Deviations or discovered specification problems

- None. The pre-existing `/api/config` path was an implementation defect covered by the approved 2.2.0 contract.

## Scope check

- [x] No bridge-switch/multi-bridge behavior added.
- [x] No durable operation journals added.
- [x] No cloud/remote diagnostics added.
- [x] No obsolete legacy UI runtime imported into the active app.
- [x] No later-phase work pulled forward without justification.

## Handoff notes

- What now exists: `HueHttpTransport.requestApiRoot()` and `HueV1Adapter.provision()` using exact `POST /api`.
- Files/interfaces next phase should rely on: `HueTransportError`, `HueResponseError`, `hueResponseErrorMessage`, and the injected `HueHttpClient` test seam.
- Pending target-gated work: live Hue provisioning remains for Phase 08.
