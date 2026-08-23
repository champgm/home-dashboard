# Home Dashboard Configuration Defaults / User Overlay Change Plan — 2.1.0

## Authority

This change plan starts from the approved `docs/SRS_2.0.0.yaml` and `docs/SAD_2.0.0.yaml` and the current 2.0 implementation.

- Phase 01 is a **required specification/architecture revision gate**. It creates `docs/SRS_2.1.0.yaml` and `docs/SAD_2.1.0.yaml` before implementation changes begin.
- The SRS defines **what must be true**.
- The SAD defines **how the selected implementation satisfies the SRS**.
- Phases 02–07 are subordinate to the approved 2.1.0 SRS/SAD and must stop if those documents are not approved.
- If a later phase exposes a requirement ambiguity, stop and flag an SRS revision.
- If a later phase exposes an architectural contradiction or impractical mechanism, stop and flag a SAD revision.
- Do not silently change the permanent-single-bridge invariant, Hue protected binding, device protocols, full Hue V1 scope, privacy model, or foreground-only runtime behavior.

## Stakeholder change being implemented

The desired effective configuration model is:

```text
bundled defaults shipped in the APK
              +
phone-local user overrides / additions / removals
              =
       effective AppConfig
```

The required semantics are:

1. The APK may bundle a default Hue bridge private IPv4 address.
2. The APK may bundle TP-Link plug endpoints with stable IDs, private IPv4 addresses, and ports.
3. A later APK may introduce new bundled defaults, and they become effective where the phone has made no explicit conflicting choice.
4. A user edit always overrides the corresponding bundled default.
5. A user removal of a bundled plug remains removed across later application updates; absence is therefore distinct from explicit removal.
6. User-added plugs remain present across application updates.
7. Reset Local Configuration discards phone-local non-secret overrides/additions/removals and resolves against the **currently installed APK's** bundled defaults.
8. Corrupt/unreadable persisted configuration or storage I/O failure must never be treated as permission to merge/seed defaults.
9. The protected `{bridgeId, credential}` Hue binding remains outside this non-secret overlay and survives Reset Local Configuration.
10. Bundled plug IDs are persistent identities. Once released, an ID must never be reused for another physical plug and should not change merely because its IP address changes.

## Repository-root path conventions

All paths in this plan are relative to the Home Dashboard repository root.

### Existing prerequisites at plan start

- `docs/SRS_2.0.0.yaml`
- `docs/SAD_2.0.0.yaml`
- `docs/validate_home_dashboard_docs_2.0.0.py`
- `src/config/plugPreseed.ts`
- `src/config/endpointValidation.ts`
- `src/storage/ConfigStore.ts`
- `src/storage/configSchema.ts`
- `src/app/types.ts`
- `src/ui/screens/BridgeConfigurationScreen.tsx`
- `src/ui/screens/PlugAdministrationScreen.tsx`
- `src/app/HueProvisioningService.ts`
- `src/storage/CredentialStore.ts`
- `test/`

### Outputs created by Phase 01

- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `docs/validate_home_dashboard_docs_2.1.0.py`
- `docs/BASELINE_REVIEW_2.1.0.md`

Phases 02–07 must read those 2.1.0 outputs and must not implement against 2.0.0 after Phase 01.

### Evidence output

Each phase creates:

`implementation_evidence/config-defaults-2.1.0/phase-XX.md`

using `99_PHASE_HANDOFF_TEMPLATE.md`.

## Phase execution rules

1. Execute phases sequentially.
2. Treat every phase as a clean commit/review boundary.
3. Write tests with the implementation in that phase.
4. Do not mutate `HueBinding` or introduce bridge switching/replacement behavior.
5. Do not put household credentials into bundled defaults. Only non-secret private IPv4/port/default metadata belongs there.
6. Do not implement the feature by copying all bundled defaults into AsyncStorage after every upgrade. Persistence should record **user intent/provenance**, not a materialized snapshot that loses the distinction between default and override.
7. Do not resurrect an explicitly removed bundled plug.
8. Do not silently normalize corrupt persisted data into an empty overlay.
9. Do not replace AsyncStorage with a database or introduce remote-operation journals for this change.
10. If a bundled plug already exists in installed 2.0.0 configuration, prefer retaining its existing endpoint ID as the new stable bundled ID. Avoid unnecessary re-keying because Favorites refer to `plugEndpointId`.

## Testing expectations

The existing project commands remain authoritative:

```sh
npm run typecheck
npm run lint
npm run test:ci
npm run doctor
git diff --check
```

Focused Jest commands may be used during a phase, but the complete suite is required at Phase 07 exit.

Tests must include at least two bundled-default generations (A and B) so update behavior is tested rather than inferred.

## No-scope-creep rule

This change does **not** authorize:

- Hue bridge replacement/switching/migration;
- cloud configuration sync;
- hostname/DNS discovery;
- TP-Link discovery;
- local display aliases separate from the physical TP-Link alias;
- changes to Hue or TP-Link protocol semantics;
- changes to Favorites identity rules beyond what is necessary to preserve existing plug endpoint IDs during migration;
- a general-purpose configuration framework for arbitrary future settings.

If another defaultable field is desired later, add it deliberately to the SRS/SAD and overlay schema rather than making the overlay dynamically accept arbitrary keys.

## Handling discovered defects

- **SRS issue:** record `BLOCKED — SRS REVISION REQUIRED`; stop.
- **SAD issue:** record `BLOCKED — SAD REVISION REQUIRED`; stop.
- **Migration ambiguity involving real installed data:** preserve the current stored configuration unchanged, record the fixture/problem, and stop rather than guessing.
- **Implementation bug:** fix within the owning phase.

## Completion / handoff protocol

A phase is complete only when:

- all in-scope implementation exists;
- required tests pass;
- evidence is written to `implementation_evidence/config-defaults-2.1.0/phase-XX.md`;
- no SRS/SAD issue is silently deferred;
- no later-phase work was pulled forward without an explicit dependency reason.

The next coding LLM should reconstruct context from the repository and persisted evidence, not prior chat history.

## Phase index

| Phase | Objective | Depends on |
|---:|---|---|
| 01 | [Revise and approve SRS/SAD 2.1.0](./01_AUTHORITATIVE_SPEC_REVISION.md) | none |
| 02 | [Bundled defaults and pure resolution model](./02_BUNDLED_DEFAULTS_AND_RESOLUTION.md) | 01 |
| 03 | [Persisted user-overlay schema and v1 migration](./03_USER_OVERLAY_SCHEMA_AND_MIGRATION.md) | 02 |
| 04 | [ConfigStore overlay integration](./04_CONFIGSTORE_OVERLAY_INTEGRATION.md) | 03 |
| 05 | [Hue bridge default integration](./05_BRIDGE_DEFAULT_INTEGRATION.md) | 04 |
| 06 | [Plug default/override/removal integration](./06_PLUG_DEFAULT_INTEGRATION.md) | 04 |
| 07 | [Upgrade, reset, two-phone, and target acceptance](./07_UPGRADE_AND_FINAL_ACCEPTANCE.md) | 05, 06 |

## Context-pressure rationale

The plan deliberately separates:

- pure resolution logic from persistence/migration;
- migration representation from ConfigStore orchestration;
- bridge UI/provisioning behavior from plug override/tombstone behavior;
- local implementation from real upgrade/target acceptance.

This prevents a coding LLM from simultaneously carrying schema migration, merge precedence, UI behavior, SecureStore invariants, and upgrade fault cases in one phase.
