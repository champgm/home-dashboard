# Phase 07 — Upgrade, Reset, Two-Phone, and Target Acceptance

Before implementation, read:

- `docs/config-defaults-2.1.0/00_IMPLEMENTATION_PLAN.md`
- `docs/config-defaults-2.1.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `implementation_evidence/config-defaults-2.1.0/phase-05.md`
- `implementation_evidence/config-defaults-2.1.0/phase-06.md`

## Objective

Close the change with full upgrade/reset/regression evidence, including a real signed-build update path where practical, both-phone independence, and final reconciliation of every affected SRS acceptance criterion.

## Why this phase exists

The feature exists to change behavior **across application versions**. Unit tests are necessary but not sufficient; this phase proves that real persisted 2.0 state migrates and that new bundled defaults behave correctly in an installed 2.1 build.

## Authoritative requirements

- `CON-005`
- `HUE-001`
- `HUE-012`
- `TPL-002`
- `TPL-009`
- `DATA-001`
- `DATA-002`
- `DATA-003`
- `DATA-005`
- supporting `SEC-001`, `TPL-010`, privacy requirements

## Relevant SAD sections

- all 2.1.0 persistence/default/overlay/migration sections
- Android release/update architecture
- protected HueBinding architecture

## In scope

- Complete full local automated regression suite.
- Add explicit update-generation fixtures/tests A→B.
- Build a 2.1 release APK using the existing signing/update path.
- Where a test device is available, install/prepare a 2.0 build with representative persisted state, then update in place to 2.1 and verify migration/effective defaults.
- Verify two phones remain independent.
- Verify Reset Local Configuration produces current bundled defaults but leaves HueBinding intact.
- Re-run backup/privacy/security checks relevant to changed persistent data.
- Reconcile every criterion in `00_REQUIREMENT_PHASE_MAP.md` and persist final change traceability.

## Explicitly out of scope

- unrelated Hue/TP-Link feature work;
- bridge switching;
- cloud sync;
- adding future default fields not approved in SRS/SAD 2.1.0.

## Expected repository changes

### Existing prerequisites

- all outputs from Phases 01–06
- existing release/build configuration
- existing 2.0 APK or reproducible 2.0 release artifact for update test

### Expected outputs

- final update/regression tests and fixtures
- `implementation_evidence/config-defaults-2.1.0/phase-07.md`
- `implementation_evidence/config-defaults-2.1.0/final-traceability-status.md`
- release artifact if this change is being released immediately

## Required acceptance scenarios

### Upgrade scenario A → B

Prepare version A effective state:

- bridge uses bundled default, then test a second case with a user bridge override;
- seeded plug P1 untouched;
- seeded plug P2 edited;
- seeded plug P3 explicitly removed;
- user plug U1 added;
- Favorites/settings populated.

Version B changes/adds defaults:

- changes bundled bridge default;
- changes P1 default endpoint;
- changes P2 default endpoint;
- still includes P3;
- adds P4.

Expected after update:

- no bridge override case -> B bridge default becomes effective;
- bridge override case -> user value remains effective;
- P1 -> B default;
- P2 -> user override;
- P3 -> still absent;
- P4 -> appears;
- U1 -> remains;
- Favorites/settings -> remain;
- no configuration network synchronization occurs.

### Corruption / I/O

- corrupt persisted overlay -> shell diagnostic, no automatic defaults, no overwrite;
- read failure -> no defaults treated as successful config;
- explicit reset -> current B defaults become effective;
- protected HueBinding survives.

## Tests

- Full Jest suite.
- Typecheck/lint/Expo doctor.
- Existing fixture-secret check.
- Automated A/B update simulation.
- Target-gated signed APK in-place upgrade on at least one Pixel if available.
- On both phones, verify independent overrides/removals.
- With WAN disabled if practical, verify default-derived bridge/plug endpoints still use LAN-only runtime paths.

### Target-gated checks

May be marked `PENDING TARGET` only if physical Pixel/release-signing environment is unavailable. A production release must not be declared complete until the in-place update test is closed.

## Acceptance focus

Close at minimum:

- `AC-CON-005`
- `AC-HUE-001`
- `AC-TPL-002`
- `AC-TPL-009`
- `AC-DATA-001`
- `AC-DATA-002`
- `AC-DATA-003`
- `AC-DATA-005`
- reset/protected-binding portion of `AC-HUE-017`

If Phase 01 adds/revises acceptance IDs, update this list before Phase 07 begins.

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci
npm run check:fixture-secrets
npm run doctor
npm run build
git diff --check
```

If a release APK is produced, record its filename and SHA-256 in evidence.


## Persisted implementation evidence

Create or update `implementation_evidence/config-defaults-2.1.0/phase-07.md` using `docs/config-defaults-2.1.0/99_PHASE_HANDOFF_TEMPLATE.md`.

Record exact commands/results, requirement IDs addressed, acceptance criteria exercised, materially changed files, known limitations, target-gated work, and any SRS/SAD defect. Important state must not exist only in chat output.

## Exit criteria

- [ ] Every in-scope item exists.
- [ ] All required non-target-gated tests/checks pass.
- [ ] Evidence file for this phase is complete.
- [ ] No SRS/SAD issue is silently deferred.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
