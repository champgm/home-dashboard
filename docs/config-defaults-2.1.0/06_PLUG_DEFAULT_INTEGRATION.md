# Phase 06 — Plug Default, Override, Addition, and Removal Integration

Before implementation, read:

- `docs/config-defaults-2.1.0/00_IMPLEMENTATION_PLAN.md`
- `docs/config-defaults-2.1.0/00_REQUIREMENT_PHASE_MAP.md`
- `docs/SRS_2.1.0.yaml`
- `docs/SAD_2.1.0.yaml`
- `implementation_evidence/config-defaults-2.1.0/phase-04.md`

## Objective

Make plug endpoint administration operate on the resolved default/overlay model so seeded endpoints can be edited or deliberately removed, user-added endpoints remain independent, and future APK defaults can add new endpoints without overwriting user intent.

## Why this phase exists

Plug removal requires provenance/tombstone behavior that does not apply to the bridge field. Keeping it separate avoids mixing two different mutation semantics.

## Authoritative requirements

- `TPL-002`
- `TPL-009`
- supporting `TPL-003`, `TPL-010`, `DATA-002`, `CON-005`

## Relevant SAD sections

- 2.1.0 plug default/overlay semantics
- ConfigStore mutation interface
- TP-Link endpoint model

## In scope

- Populate household bundled plug endpoints with stable IDs/IP/port.
- Update `PlugAdministrationScreen` and related service/config mutation paths to distinguish:
  - seeded endpoint with no override;
  - seeded endpoint with override;
  - seeded endpoint explicitly removed;
  - user-added endpoint.
- Editing a seeded endpoint preserves its stable endpoint ID and creates an override.
- Removing a seeded endpoint creates a tombstone/removal record.
- Removing a user-added endpoint removes the addition.
- Adding a user plug rejects collisions with effective/bundled IDs and validates IPv4/port.
- If the user edits an endpoint back to the bundled value, canonical overlay may drop the override.
- Favorites continue to refer to the stable endpoint ID.

## Explicitly out of scope

- changing physical TP-Link alias semantics;
- TP-Link discovery;
- changing relay/energy protocol behavior;
- inventing local plug display aliases;
- re-keying seeded endpoints solely because their IP changes.

## Expected repository changes

### Existing prerequisites

- `src/config/bundledDefaults.ts`
- `src/ui/screens/PlugAdministrationScreen.tsx`
- `src/app/ApplicationService.ts`
- `src/app/types.ts`
- ConfigStore overlay APIs from Phase 04

### Expected outputs

- household bundled plug entries
- plug administration/service changes
- UI/config tests
- `implementation_evidence/config-defaults-2.1.0/phase-06.md`

## Required implementation behavior

- Stable seed IDs are deployment data identities, not regenerated from a changed IP after first publication.
- Prefer the 2.0 installed endpoint IDs as the initial stable seed IDs to preserve existing Favorites/migration semantics.
- A new seed in APK B appears automatically unless explicitly removed/overridden.
- A removed seed stays removed in B.
- A user-added plug stays added in B.
- An override wins over a changed seed value in B.
- Removing an endpoint remains local-only and never sends factory-reset/reboot/unpair commands.
- Physical plug alias remains the only user-visible plug name after sysinfo is available.

## Tests

Use defaults A and B to cover:

- untouched seeded plug follows changed default A→B;
- edited seeded plug does not follow changed default;
- removed seeded plug does not reappear;
- new seeded plug appears;
- user-added plug survives;
- Favorite to seeded plug remains bound to stable ID after endpoint IP override;
- edit back to default canonicalizes override if SAD selects that behavior;
- endpoint collision/validation failures occur before network I/O;
- remove remains local-only.

## Acceptance focus

- `AC-TPL-002`
- `AC-TPL-009`
- supporting `AC-CON-005`, `AC-DATA-002`

## Commands / checks

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/config test/storage test/app test/ui
git diff --check
```


## Persisted implementation evidence

Create or update `implementation_evidence/config-defaults-2.1.0/phase-06.md` using `docs/config-defaults-2.1.0/99_PHASE_HANDOFF_TEMPLATE.md`.

Record exact commands/results, requirement IDs addressed, acceptance criteria exercised, materially changed files, known limitations, target-gated work, and any SRS/SAD defect. Important state must not exist only in chat output.

## Exit criteria

- [ ] Every in-scope item exists.
- [ ] All required non-target-gated tests/checks pass.
- [ ] Evidence file for this phase is complete.
- [ ] No SRS/SAD issue is silently deferred.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
