# Phase 02 — Local Configuration and Endpoint Validation

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 01

## Objective

Implement the single-object AsyncStorage configuration store, private/local IPv4 and port validation, bundled plug preseed semantics, and explicit corrupt/I/O-error handling.

## Why this phase exists

Protocol and UI phases need a deterministic source of endpoints and Favorites. The SAD deliberately uses one small configuration object, so this phase can fully settle persistence without remote-operation recovery machinery.

## Authoritative requirements

- `CON-005` (**PRIMARY OWNER**) — Each phone shall maintain its own independent Home Dashboard configuration and Favorites; the application shall not synchronize these datasets between phones.
- `CON-010` (**PRIMARY OWNER**) — Hue bridge and TP-Link plug runtime endpoints shall be configured as literal private/local IPv4 addresses; hostname/DNS discovery is outside the supported production configuration.
- `DATA-001` (**PRIMARY OWNER**) — Each phone shall persist one phone-local non-secret configuration dataset containing the Hue bridge IPv4 endpoint, configured plug endpoints, Favorites, and local UI settings across ordinary restarts.
- `DATA-002` (**PRIMARY OWNER**) — A normal signed application update from one modern Home Dashboard release to the next shall preserve valid local configuration and Favorites.
- `DATA-003` (**PRIMARY OWNER**) — If the persisted non-secret configuration dataset is unreadable or invalid, the application shall start its navigation/configuration shell, identify the local-configuration error, shall not silently overwrite the stored value or seed defaults, and shall require explicit user Reset Local Configuration before discarding it.
- `DATA-004` (**PRIMARY OWNER**) — The application shall use dynamically sized collections and shall support at least the characterized Hue household inventory plus the bundled plug endpoint set and Favorites for that complete household inventory without truncation or an application-imposed small fixed count.
- `DATA-005` (**PRIMARY OWNER**) — A persistence read/write I/O failure shall not be treated as successful absence or successful save and shall not automatically trigger default seeding.
- `TPL-003` (**PRIMARY OWNER**) — Plug endpoint input shall reject a missing/invalid IPv4 address and ports outside 1 through 65535 before attempting network I/O.
- `TPL-002` (supporting) — Each plug endpoint shall be configurable in the GUI by IPv4 address and TCP port, with 9999 used as the default port when not otherwise specified.
- `TPL-009` (supporting) — The application shall support bundled pre-seeded plug endpoint information and shall allow each phone to modify its local endpoint list after first use without application upgrades silently overwriting those edits.

## Relevant SAD sections

- `SAD_2.0.0.yaml:internal_domain_interfaces.types.AppConfig`
- `SAD_2.0.0.yaml:internal_domain_interfaces.services.ConfigStore`
- `SAD_2.0.0.yaml:persistence_architecture`
- `SAD_2.0.0.yaml:preseed_architecture`
- `SAD_2.0.0.yaml:security_architecture.endpoint_restriction`

## In scope

- Install/use `@react-native-async-storage/async-storage`.
- Implement `AppConfig` validation and immutable config mutation helpers.
- Implement `ConfigStore.load/save/reset` with the SAD Loaded/Absent/Corrupt/IoError distinctions.
- Serialize writes through one in-process queue/mutex and advance committed in-memory config only after `setItem` succeeds.
- Implement literal private/local IPv4 validation and port range validation; no DNS or hostname path.
- Add bundled plug preseed data containing endpoint/port only; apply only when the config key is absent.
- Implement explicit Reset Local Configuration semantics that affect only non-secret configuration.

## Explicitly out of scope

- SecureStore Hue binding
- Hue provisioning
- Plug network I/O
- Any SQLite/database/journal mechanism
- Settings/admin screens

## Expected repository changes

### Existing prerequisite files/directories

- src/storage/
- src/config/
- implementation_evidence/phase-01.md
- `implementation_evidence/phase-01.md` (output of Phase 01)

### Expected outputs created or materially modified by this phase

- package.json
- package-lock.json
- src/storage/ConfigStore.ts
- src/storage/configSchema.ts
- src/config/endpointValidation.ts
- src/config/plugPreseed.ts
- test/storage/
- test/config/
- implementation_evidence/phase-02.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- Missing key and read I/O failure are different states.
- Corrupt/unreadable existing data must not trigger preseed or overwrite.
- Reset is explicit and reapplies current bundled plug defaults.
- Collections are dynamic; do not introduce a small fixed Favorite/resource limit.
- Configuration writes on one phone have no synchronization behavior.

## Tests

- Absent key -> preseed; present valid key -> use exactly persisted values.
- Corrupt JSON/schema -> ConfigError result and original value preserved.
- Injected `getItem`/`setItem` failure -> IoError, never successful absence/save.
- Concurrent local config mutation requests are serialized and cannot lose a prior committed mutation.
- Private IPv4 and port boundary tests, including rejected public/loopback/multicast/broadcast/hostname inputs.
- Update/migration fixture showing valid previous config survives code update behavior.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-02.md`. Do not pretend it passed.

## Acceptance focus

- `AC-CON-005` — Change Favorites and plug endpoints on Phone A and verify Phone B remains unchanged and no synchronization network request occurs.
- `AC-CON-010` — Attempt to save a hostname, public IPv4 address, multicast address, or invalid IPv4 literal and verify validation rejects it before device I/O; verify valid RFC1918 bridge/plug addresses save successfully.
- `AC-TPL-002` — Add/edit a plug with a private IPv4 address and omitted port, verify port 9999 is stored; edit to another valid port and verify it persists.
- `AC-TPL-003` — Submit blank/invalid/public IPs and ports 0/65536/non-numeric and verify validation occurs before the adapter is called.
- `AC-TPL-009` — Install with preseed data, edit/remove/add endpoints, simulate an app update containing the same/new defaults, and verify existing local edits remain authoritative.
- `AC-DATA-001` — Save configuration/Favorites, perform two rapid back-to-back local configuration mutations (for example Favorite change plus plug endpoint edit), force-stop/restart the app, and verify both committed changes reload without lost-update truncation.
- `AC-DATA-002` — Install a prior modern build, create configuration/Favorites, update in place to the new signed build, and verify valid data remains.
- `AC-DATA-003` — Inject malformed JSON and storage read failure; verify the shell starts with a configuration-error diagnostic, the raw value is not overwritten, and defaults appear only after explicit Reset.
- `AC-DATA-004` — Load the frozen 216-resource Hue fixture plus the bundled plug list, Favorite every entry, persist/reload, and verify no truncation or fixed-count rejection.
- `AC-DATA-005` — Inject read/write failures and verify UI reports unavailable/unsaved state, preserves existing data where readable, and does not claim success or seed defaults.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npx expo install @react-native-async-storage/async-storage
npm run typecheck
npm run lint
npm run test:ci -- test/storage test/config
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-02.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

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
- [ ] `implementation_evidence/phase-02.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
