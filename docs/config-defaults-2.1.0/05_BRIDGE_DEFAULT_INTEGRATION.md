# Phase 05 — Hue Bridge Default Integration

Before implementation, read:

- `docs/config-defaults-2.1.0/00_IMPLEMENTATION_PLAN.md`
- `docs/config-defaults-2.1.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `implementation_evidence/config-defaults-2.1.0/phase-04.md`

## Objective

Make the bundled Hue bridge private IPv4 default flow through the existing Bridge Configuration and provisioning paths while preserving the permanent protected bridge identity and allowing a phone-local IPv4 override.

## Why this phase exists

The bridge default touches UI and provisioning but must not accidentally become bridge switching. Isolating it from plug overlay work keeps the permanent-bridge invariant actively visible.

## Authoritative requirements

- `HUE-001`
- `HUE-012`
- supporting `SEC-001`, permanent-single-bridge guardrail, `DATA-002`, `DATA-003`

## Relevant SAD sections

- 2.1.0 bundled bridge default semantics
- `security_architecture.credentials`
- Hue provisioning/reauthorization architecture
- ConfigStore effective-config interface

## In scope

- Populate the default bridge IPv4 in `src/config/bundledDefaults.ts` for the household build.
- `BridgeConfigurationScreen` displays the effective bridge IPv4 even when it comes only from bundled defaults.
- Saving another valid private IPv4 creates/updates a phone-local override.
- Saving the current bundled default may canonicalize by removing the override if selected by SAD 2.1.0.
- Initial Hue provisioning uses the effective bridge IPv4.
- Existing HueBinding `{bridgeId, credential}` remains permanent and authoritative.
- If an effective endpoint reaches a different bridgeId, existing identity-mismatch behavior remains unchanged; defaults do not authorize adoption.

## Explicitly out of scope

- modifying/deleting HueBinding;
- bridge replacement/switching;
- hostname/DNS support;
- plug UI;
- Hue protocol changes.

## Expected repository changes

### Existing prerequisites

- `src/config/bundledDefaults.ts`
- `src/ui/screens/BridgeConfigurationScreen.tsx`
- `src/app/HueProvisioningService.ts`
- `src/app/HueReauthorizationService.ts`
- `src/storage/CredentialStore.ts`

### Expected outputs

- household bridge default entry
- BridgeConfiguration/provisioning integration changes
- component/service tests
- `implementation_evidence/config-defaults-2.1.0/phase-05.md`

## Required implementation behavior

- No user override -> APK bridge default is effective immediately.
- User override -> override survives app restart and later APK default changes.
- Reset Local Configuration -> override is removed and current APK bridge default becomes effective.
- Protected bridge identity survives reset.
- A new APK's changed default cannot silently switch bridge identity because authentication still verifies the permanent `bridgeId`.
- Invalid bundled bridge IP must be caught by tests/default validation, not silently ignored.

## Tests

- Clean effective config shows bundled bridge address.
- GUI override wins.
- Defaults A→B with override: override remains.
- Defaults A→B without override: B becomes effective.
- Reset returns to current B.
- Existing mocked HueBinding survives reset.
- Different returned bridgeId still produces BridgeIdentityMismatch.
- Bridge screen never exposes credential/bridgeId as editable configuration.

## Acceptance focus

- `AC-HUE-001`
- `AC-DATA-002`
- `AC-HUE-017` reset/binding portion

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/config test/storage test/app test/ui
git diff --check
```


## Persisted implementation evidence

Create or update `implementation_evidence/config-defaults-2.1.0/phase-05.md` using `docs/config-defaults-2.1.0/99_PHASE_HANDOFF_TEMPLATE.md`.

Record exact commands/results, requirement IDs addressed, acceptance criteria exercised, materially changed files, known limitations, target-gated work, and any SRS/SAD defect. Important state must not exist only in chat output.

## Exit criteria

- [ ] Every in-scope item exists.
- [ ] All required non-target-gated tests/checks pass.
- [ ] Evidence file for this phase is complete.
- [ ] No SRS/SAD issue is silently deferred.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
