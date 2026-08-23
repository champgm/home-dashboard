# Home Dashboard Implementation Plan — SRS/SAD 2.0.0

## Authority

This plan is subordinate to `SRS_2.0.0.yaml` and `SAD_2.0.0.yaml`.

- The SRS defines **what must be true**.
- The SAD defines **how the selected implementation satisfies the SRS**.
- These phase files define only implementation order, dependencies, deliverables, verification, evidence, and exit criteria.
- If implementation exposes a requirement ambiguity, **stop the phase and flag an SRS revision**. Do not resolve it inside code or this plan.
- If implementation exposes an architectural contradiction or impractical selected mechanism, **stop the phase and flag a SAD revision**. Do not silently substitute architecture.
- `decision_guardrails.DG-001..DG-006` are explicit stakeholder decisions and are not to be re-opened during ordinary implementation/review without a stakeholder-driven SRS/SAD change.

## Repository-root path conventions

All paths in this plan are relative to the repository root. The repository root must contain:

- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `home-dashboard-characterization-evidence-1.1.0.tar.gz`
- `implementation_plan/`
- the existing Home Dashboard source (`package.json`, `App.tsx`, `app.json`, `eas.json`, legacy source/assets)

Implementation output is written in the same repository. `implementation_evidence/` is an **implementation output directory** created in Phase 01; references to `implementation_evidence/phase-XX.md` are therefore future outputs, not prerequisites at plan-delivery time.

The final architecture target follows `SAD_2.0.0.yaml:repository_structure.root`:

- `src/app/`
- `src/ui/`
- `src/protocol/hue/`
- `src/protocol/tplink/`
- `src/storage/`
- `src/config/`
- `android/` only where build/network configuration or the explicitly permitted minimal TP-Link TCP fallback requires native code.

## Phase execution rules

1. Execute phases sequentially unless a phase explicitly says a target-gated check may be carried forward.
2. Before modifying code, read the phase prompt plus `00_IMPLEMENTATION_PLAN.md`, `00_REQUIREMENT_PHASE_MAP.md`, the full SRS, and the full SAD.
3. Treat each phase as one clean branch/commit/review boundary. Do not mix later-phase feature work into an earlier phase merely because the file is open.
4. Tests are implemented with the feature, not deferred to Phase 27.
5. Do not make live destructive device calls merely to satisfy local development tests. Use fixtures/mocks unless the phase explicitly identifies target-gated live verification.
6. Do not add durable remote-operation journals, multi-bridge support, DNS/mDNS, custom VPN/network routing, recursive automation theorem-proving, or same-ID Favorite identity machinery; those are explicitly rejected by the approved baseline.
7. Do not preserve two active app architectures. Legacy code can temporarily remain as non-imported migration reference, but each migrated feature must leave only the modern runtime implementation active.
8. A phase that discovers a blocking SRS/SAD defect records it in its evidence file and stops. The next implementation phase does not begin until the authoritative documents are revised.

## Testing expectations

Phase 01 establishes these commands and later phases may rely on them:

```sh
npm run typecheck
npm run lint
npm run test:ci
```

Use focused Jest/component test paths during a phase and the whole suite at phase exit when practical. `npx expo-doctor` is required after dependency/native-platform changes. `git diff --check` is a standard phase-exit hygiene check.

Fixture-backed protocol tests must use the sanitized characterization evidence and must not expose deployed Hue credentials or authorization identifiers.

A criterion may span more than one phase. A phase may mark a criterion **PARTIAL / ADVANCED** when its protocol or UI slice is complete but the criterion explicitly requires downstream UI or live-target work. The primary requirement owner remains accountable for documenting that handoff; Phase 27 closes every criterion.

## No-scope-creep rule

A coding LLM must not:

- invent new user-visible behavior to make implementation easier;
- change protocol compatibility policy;
- replace the permanent single-bridge invariant;
- silently narrow full Hue V1 management scope;
- add cloud/runtime services;
- add architectural recovery machinery rejected by DG-003;
- pull later-phase UI/platform work into a protocol phase without an explicit documented dependency reason.

If an improvement is desirable but not required, record it under **Handoff / future consideration** in evidence and leave it unimplemented.

## Persisted evidence requirements

Every phase creates or updates `implementation_evidence/phase-XX.md` using `99_PHASE_HANDOFF_TEMPLATE.md`. Evidence must include:

- exact commit/revision under review;
- work completed and materially changed files;
- primary and supporting requirement IDs;
- tests/commands executed and actual results;
- acceptance criteria exercised;
- known limitations;
- target-gated checks still pending;
- deviations or discovered spec/design problems;
- next-phase handoff notes.

Important state must not exist only in chat output.

## Target-gated work

Real Pixel phones, the Hue link button/bridge, TP-Link hardware, signing credentials, WAN-disabled LAN conditions, and EAS/native toolchains may not always be available. A phase may complete its local implementation when its prompt explicitly permits a target-gated check to move forward, but its evidence must mark that check **PENDING TARGET**. Phase 27 must close every such item or report the release blocked.

The one exception is Phase 13's TP-Link socket-provider spike: the wider TP-Link feature phase depends on knowing whether `react-native-tcp-socket` works on RN 0.86/Pixel hardware, so that provider decision must close before Phase 14.

## Handling discovered specification/design defects

- **SRS ambiguity/conflict:** stop; evidence status `BLOCKED — SRS REVISION REQUIRED`.
- **SAD contradiction/impractical mechanism:** stop; evidence status `BLOCKED — SAD REVISION REQUIRED`.
- **Implementation bug within valid SRS/SAD:** fix within the current phase.
- **Accepted DG/RISK scenario:** do not redesign it unless the stakeholder changes the requirement.

## Completion and handoff protocol

A phase is complete only when all Exit Criteria boxes in its phase file are satisfied and `implementation_evidence/phase-XX.md` is committed with the code. The implementing LLM should finish by giving the reviewer only:

- phase status;
- commit/revision;
- test summary;
- evidence path;
- unresolved target-gated checks;
- any SRS/SAD blocker.

The next LLM should reconstruct state from repository code + persisted evidence, not from prior chat reasoning.

## Phase index

| Phase | Objective | Depends on | Primary SRS owners |
|---:|---|---|---:|
| 01 | [Modern App Foundation](./01_MODERN_APP_FOUNDATION.md) | none | 3 |
| 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | 01 | 8 |
| 03 | [Protected Hue Binding Store](./03_PROTECTED_HUE_BINDING.md) | 02 | 1 |
| 04 | [Hue V1 Transport Core](./04_HUE_TRANSPORT_CORE.md) | 02, 03 | 5 |
| 05 | [Hue Snapshot and Compatibility Fixtures](./05_HUE_SNAPSHOT_AND_COMPATIBILITY.md) | 04 | 2 |
| 06 | [Hue Lights and Groups Protocol](./06_HUE_LIGHTS_GROUPS_PROTOCOL.md) | 04, 05 | 2 |
| 07 | [Hue Scenes Protocol](./07_HUE_SCENES_PROTOCOL.md) | 04, 05, 06 | 1 |
| 08 | [Hue Sensors and Search Protocol](./08_HUE_SENSORS_SEARCH_PROTOCOL.md) | 04, 05 | 2 |
| 09 | [Hue Rules Protocol and Catalog](./09_HUE_RULES_PROTOCOL.md) | 04, 05 | 1 |
| 10 | [Hue Schedules Protocol and Catalog](./10_HUE_SCHEDULES_PROTOCOL.md) | 04, 05 | 1 |
| 11 | [Hue Action Policy and Partial-Update Enforcement](./11_HUE_ACTION_POLICY_AND_PARTIAL_UPDATES.md) | 09, 10 | 2 |
| 12 | [Hue Resource Links and Read-only Bridge Administration](./12_HUE_RESOURCE_LINKS_AND_BRIDGE_READS.md) | 04, 05, 11 | 2 |
| 13 | [TP-Link Legacy Transport and Pixel Device Spike](./13_TPLINK_TRANSPORT_AND_DEVICE_SPIKE.md) | 01, 02 | 4 |
| 14 | [TP-Link Plug Feature Protocol](./14_TPLINK_FEATURE_PROTOCOL.md) | 13 | 3 |
| 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | 06, 07, 08, 09, 10, 11, 12, 14 | 10 |
| 16 | [Foreground Lifecycle and Polling](./16_FOREGROUND_LIFECYCLE_AND_POLLING.md) | 15, 08 | 5 |
| 17 | [Navigation, Favorites, and Shared Resource UI](./17_NAVIGATION_FAVORITES_SHARED_UI.md) | 02, 15, 16 | 5 |
| 18 | [Destructive Action Confirmation and Cleanup](./18_DESTRUCTIVE_ACTIONS.md) | 02, 15, 17 | 5 |
| 19 | [Lights and Groups UI](./19_LIGHTS_GROUPS_UI.md) | 06, 15, 17, 18 | 0 |
| 20 | [Scenes and Sensors UI](./20_SCENES_SENSORS_UI.md) | 07, 08, 15, 17, 18 | 1 |
| 21 | [Rules and Schedules UI](./21_RULES_SCHEDULES_UI.md) | 09, 10, 11, 15, 17, 18 | 0 |
| 22 | [Advanced Hue, Resource Links, and Diagnostics UI](./22_ADVANCED_HUE_UI.md) | 12, 17, 18 | 0 |
| 23 | [Hue Initial Provisioning](./23_HUE_INITIAL_PROVISIONING.md) | 02, 03, 04, 05, 22 | 4 |
| 24 | [Hue Same-Bridge Reauthorization](./24_HUE_SAME_BRIDGE_REAUTHORIZATION.md) | 10, 21, 23 | 2 |
| 25 | [Plug UI, Endpoint Administration, and Editor Contract Audit](./25_PLUG_UI_AND_EDITOR_CONTRACT.md) | 02, 14, 17, 18, 19, 20, 21, 22 | 5 |
| 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 | 8 |
| 27 | [Final End-to-End Acceptance and Traceability Closure](./27_FINAL_END_TO_END_ACCEPTANCE.md) | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26 | 3 |

## Final acceptance rule

Phase 27 is verification/integration, not a rescue implementation phase. If it reveals major missing implementation, return to the owning phase from `00_REQUIREMENT_PHASE_MAP.md`, correct it there, update evidence, then rerun final acceptance.
