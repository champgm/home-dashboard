# Phase 13 — TP-Link Legacy Transport and Pixel Device Spike

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 01, Phase 02

## Objective

Implement the legacy TP-Link TCP framing/XOR transport and prove the selected React Native socket provider works on at least one Pixel 9 Pro before wider plug functionality is built.

## Why this phase exists

The socket provider is the main target-specific technical risk. The SAD explicitly requires an early device spike and a minimal fallback only if the preferred provider fails.

## Authoritative requirements

- `CON-009` (**PRIMARY OWNER**) — TP-Link plug discovery shall not be required or performed; plug endpoints shall be configured explicitly.
- `TPL-001` (**PRIMARY OWNER**) — The application shall control the deployed TP-Link HS100, HS103, and HS110 plugs by direct local legacy protocol communication without TP-Link cloud services.
- `TPL-004` (**PRIMARY OWNER**) — Production TP-Link commands shall be sent only to configured private/local IPv4 endpoints; hostname resolution and public-DNS lookup are outside the supported production design.
- `TPL-011` (**PRIMARY OWNER**) — A TP-Link response with an explicit non-success error code shall be treated as definite failure; malformed, truncated, or missing success envelopes shall never be treated as success and shall be ambiguous for writes that may have been transmitted.
- `CON-007` (supporting) — Hue and TP-Link device firmware/software upgrades shall not be prerequisites for any required Home Dashboard function.
- `SEC-003` (supporting) — Legacy cleartext Hue/TP-Link protocol operations shall accept only configured private/local IPv4 destinations and the application shall not provide a general-purpose arbitrary HTTP/TCP request facility.
- `QA-003` (supporting) — Hue V1 and TP-Link legacy protocol logic shall be isolated from UI/navigation so UI tests can run without live devices and protocol tests can run without rendering UI.

## Relevant SAD sections

- `SAD_2.0.0.yaml:plug_protocol_design`
- `SAD_2.0.0.yaml:selected_platform.tplink_socket`
- `SAD_2.0.0.yaml:implementation_constraints`
- `SAD_2.0.0.yaml:verification_architecture.baseline_characterization`

## In scope

- Install `react-native-tcp-socket` behind a small transport interface.
- Implement 4-byte big-endian length framing and XOR-autokey codec with 64 KiB declared payload bound.
- Implement request/response timeout and definite-versus-ambiguous write classification.
- Reject discovery/broadcast/hostname flows.
- Run a minimal direct `get_sysinfo` request on one configured representative plug on a Pixel development build.
- If and only if the provider fails RN 0.86 device validation for a documented native compatibility reason, implement the minimal Android TCP provider behind the same interface.

## Explicitly out of scope

- Relay/alias/energy domain UI
- Plug list screens
- Discovery
- General-purpose socket API

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/tplink/
- src/config/endpointValidation.ts
- home-dashboard-characterization-evidence-1.1.0.tar.gz
- `implementation_evidence/phase-01.md` (output of Phase 01)
- `implementation_evidence/phase-02.md` (output of Phase 02)

### Expected outputs created or materially modified by this phase

- package.json
- package-lock.json
- src/protocol/tplink/TcpTransport.ts
- src/protocol/tplink/tplinkCipher.ts
- src/protocol/tplink/tplinkFrame.ts
- src/protocol/tplink/TpLinkLegacyAdapter.ts
- test/protocol/tplink/transport/
- implementation_evidence/phase-13.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Never add UDP discovery.
- A malformed/truncated/missing-success response after a possible write is not success.
- Transport destination comes only from validated configured endpoint.
- Fallback native code, if needed, must remain narrower than the adapter and must not become a second protocol implementation.

## Tests

- Known cipher/frame vectors from characterization/reference.
- Truncated/oversize/malformed frame tests.
- Explicit err_code classification.
- Mock socket possible-send timeout ambiguity.
- Target-gated Pixel direct-host sysinfo spike.

### Target-gated verification

- `npx expo run:android --device` plus one direct-host `get_sysinfo` against a safe configured plug on a Pixel 9 Pro. If no target is available, record this as pending; do not begin Phase 14 until the socket provider decision is closed because Phase 14 depends on it.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-13.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-007` — Execute the acceptance suite against the frozen characterized bridge and deployed HS100/HS103/HS110 firmware without device upgrades.
- `AC-CON-009` — Run with UDP broadcast blocked and verify all configured plugs remain controllable by explicit IPv4 endpoint and that the app emits no discovery broadcast.
- `AC-TPL-001` — With WAN blocked, execute system-info and relay operations against one deployed HS100, HS103, and HS110 by configured IPv4 endpoint.
- `AC-TPL-004` — Attempt to configure a hostname or public address and verify rejection; trace successful commands and verify they target only configured private IPv4 addresses.
- `AC-TPL-011` — Inject explicit device errors, truncated frames, malformed JSON, timeout-before-send and timeout-after-send conditions and verify result classification.
- `AC-SEC-003` — Attempt public/multicast/loopback-invalid endpoint configuration and arbitrary protocol targets and verify rejection; inspect code/API surfaces for absence of a user-controlled arbitrary request console.
- `AC-QA-003` — Replace adapters with fakes in UI tests and run protocol adapter suites headlessly; verify no UI module directly performs device socket/HTTP calls.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm install react-native-tcp-socket
npm run typecheck
npm run lint
npm run test:ci -- test/protocol/tplink/transport
npx expo run:android --device
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-13.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-13.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
