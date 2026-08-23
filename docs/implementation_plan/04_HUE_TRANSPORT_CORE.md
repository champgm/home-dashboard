# Phase 04 — Hue V1 Transport Core

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 02, Phase 03

## Objective

Implement the credential-redacted Hue V1 HTTP request primitive, response/result classification, write pacing, deadlines, and private-endpoint enforcement independent of resource-specific models.

## Why this phase exists

All Hue resource phases need one trusted transport/result layer. Keeping resource schemas out prevents protocol plumbing and full Hue catalog work from sharing one large context.

## Authoritative requirements

- `HUE-012` (**PRIMARY OWNER**) — Hue operations shall use only the configured local bridge IPv4 endpoint and the locally provisioned V1 credential; Hue cloud endpoints shall not be required or contacted for runtime device control.
- `HUE-013` (**PRIMARY OWNER**) — The application shall interpret Hue V1 JSON success/error responses per operation and shall not report an operation as wholly successful when the response contains an applicable error.
- `HUE-014` (**PRIMARY OWNER**) — The application shall enforce at least 100 ms between dispatches of Hue individual-Light state writes and at least 1,000 ms between dispatches of Hue Group action writes, including Scene activation.
- `SEC-002` (**PRIMARY OWNER**) — Hue API credentials and credential-bearing authorization identifiers shall not be displayed as ordinary fields or included in production logs, exported diagnostics, exception messages surfaced by the application, or application-generated screenshots.
- `SEC-003` (**PRIMARY OWNER**) — Legacy cleartext Hue/TP-Link protocol operations shall accept only configured private/local IPv4 destinations and the application shall not provide a general-purpose arbitrary HTTP/TCP request facility.
- `REL-001` (supporting) — A failed command shall not be represented in the UI as successfully completed.
- `REL-002` (supporting) — A foreground interactive device command shall not remain pending indefinitely; if protocol completion cannot be established within 5 seconds, Pending shall end and the result shall be classified as definite failure or ambiguous outcome.
- `REL-003` (supporting) — If a foreground write has an ambiguous outcome, the application shall not automatically claim success and, where the resulting state is observable, shall attempt one read-back while foregrounded. A non-matching read-back does not prove the original write failed because another controller may have changed state.
- `PRIV-002` (supporting) — The production runtime shall contain no application-controlled path that intentionally sends Hue credentials, device state, Favorites, plug configuration, or household device metadata to a configured WAN service. Hue/TP-Link adapter request destinations shall be constructed from configured private/local IPv4 endpoints only.
- `PRIV-003` (supporting) — Normal Hue and TP-Link control shall remain functional when the phone has local-LAN connectivity to the devices but no WAN route.

## Relevant SAD sections

- `SAD_2.0.0.yaml:hue_v1_design.endpoint`
- `SAD_2.0.0.yaml:internal_domain_interfaces.services.HueV1Adapter`
- `SAD_2.0.0.yaml:failure_and_deadline_architecture`
- `SAD_2.0.0.yaml:security_architecture.credentials`
- `SAD_2.0.0.yaml:security_architecture.endpoint_restriction`
- `SAD_2.0.0.yaml:logging_and_diagnostics`

## In scope

- Implement request URL construction only from validated bridge IPv4 + protected credential.
- Implement UTF-8 JSON request/response handling and Hue success/error/partial-failure classification.
- Implement bounded five-second interactive deadline integration points and no automatic retry after bytes may have been transmitted.
- Implement dispatch pacing primitives enforcing >=100 ms Light state writes and >=1000 ms Group action writes, including Scene activation callers later.
- Implement credential/address redaction before errors/diagnostics leave the adapter.
- Provide mockable HTTP boundary for fixture tests.

## Explicitly out of scope

- Specific Lights/Groups/Scenes CRUD schemas
- Application-level read-back orchestration
- UI
- Provisioning

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/hue/
- src/config/endpointValidation.ts
- src/storage/CredentialStore.ts
- `implementation_evidence/phase-02.md` (output of Phase 02)
- `implementation_evidence/phase-03.md` (output of Phase 03)

### Expected outputs created or materially modified by this phase

- src/protocol/hue/HueV1Adapter.ts
- src/protocol/hue/httpTransport.ts
- src/protocol/hue/resultClassifier.ts
- src/protocol/hue/rateLimiter.ts
- src/protocol/hue/redaction.ts
- test/protocol/hue/core/
- implementation_evidence/phase-04.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Never expose a general-purpose arbitrary URL/method console.
- Never include `/api/<credential>` or authorization IDs in surfaced exception messages/logs.
- Mixed Hue success/error arrays produce `partial_failure`, not success.
- A write timeout after possible transmission is ambiguous.
- Pacing is based on dispatch time, not completion time.

## Tests

- Success/error/mixed Hue response fixtures.
- Timeout before send versus possible-send ambiguity.
- Credential-bearing URL/error redaction.
- Public/non-private endpoint rejection before HTTP I/O.
- Deterministic fake-clock pacing at 100 ms and 1000 ms boundaries.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-04.md`. Do not pretend it passed.

## Acceptance focus

- `AC-HUE-012` — Block WAN and verify all required Hue operations continue; inspect network traces to verify Hue runtime requests target only the configured bridge address.
- `AC-HUE-013` — Feed success, error, and mixed Hue response arrays and verify success/partial-failure/failure classification matches each operation entry.
- `AC-HUE-014` — Using a monotonic fake clock, issue repeated eligible commands and verify Light dispatches are separated by >=100 ms and Group/Scene action dispatches by >=1,000 ms.
- `AC-PRIV-002` — Capture traffic with WAN available and exercise all main functions; verify protected household data is sent only to the configured private device endpoints and no app-controlled external service.
- `AC-PRIV-003` — Remove WAN while retaining LAN routing and execute the main Hue/plug control acceptance suite.
- `AC-SEC-002` — Inject failures and inspect UI/log/diagnostic outputs for known test credentials/authorization IDs; verify none appear.
- `AC-SEC-003` — Attempt public/multicast/loopback-invalid endpoint configuration and arbitrary protocol targets and verify rejection; inspect code/API surfaces for absence of a user-controlled arbitrary request console.
- `AC-REL-001` — Inject each protocol failure class and verify no success indicator/state transition is published solely from the attempted command.
- `AC-REL-002` — Delay adapters beyond 5 seconds and verify Pending clears by the deadline with failure/ambiguous classification.
- `AC-REL-003` — Inject timeout-after-send, then matching/nonmatching read-back and concurrent-controller changes; verify matching can reconcile to success while nonmatching remains ambiguous.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/hue/core
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-04.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

At minimum record:

- work completed;
- primary/supporting requirement IDs;
- tests/checks and actual results;
- acceptance criteria exercised;
- materially changed files;
- known limitations;
- target-dependent checks not yet performed;
- deviations or discovered SRS/SAD problems;
- handoff notes.

## Exit criteria

- [ ] Every in-scope implementation item exists and follows the listed SAD sections.
- [ ] All non-target-gated tests/checks required by this phase pass.
- [ ] Every target-gated item is either passed with evidence or explicitly recorded `PENDING TARGET` where this phase permits deferral.
- [ ] `implementation_evidence/phase-04.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
