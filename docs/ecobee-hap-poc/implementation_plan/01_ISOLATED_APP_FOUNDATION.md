# Phase 01 — Isolated App Foundation and Safe Diagnostics

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisites:** none.

## Objective

Create an independently installable Expo 57 / RN 0.86 / Hermes Android spike with typed adapter contracts, deterministic test infrastructure, minimal navigation-free UI shell, and structured redacted diagnostics.

## Why this phase exists

Every later protocol phase needs the same isolated build, fakes, result vocabulary, clock/cancellation seams, and safe logging rules. Establishing them once prevents protocol work from coupling to UI or the production app.

## Authoritative requirements

- PRIMARY: `SAFE-01`, `SAFE-02`, `SAFE-04`, `ARC-01`, `ARC-02`, `ARC-14`
- Supporting: `OBJ-12`

## Relevant design sections

- `Repository and build structure`
- `Minimal POC UI`
- `Thermostat application service`
- `System boundary`
- `Logging and evidence`

## In scope

- Scaffold `spikes/ecobee-hap-poc/` without modifying root application files.
- Pin the root baseline versions: Expo 57, RN 0.86, React 19.2, TypeScript 6, Hermes.
- Add scripts required by `00_IMPLEMENTATION_PLAN.md` and Jest/TypeScript configuration.
- Define protocol-neutral result/error classes, cancellation/timeout interface, clock, byte-safe adapter contracts, and fake adapters.
- Implement a structured logger with allowlisted fields and redaction tests.
- Implement a minimal screen showing build ID and sanitized application state; no device operations yet.
- Add an evidence sanitizer/secret-pattern check usable by later phases.

## Explicitly out of scope

- Native discovery/TCP/crypto dependencies
- HAP protocol logic, pairing, credentials, thermostat UI, or production integration

## Expected repository changes

Existing prerequisites: the five documents listed above.

Expected outputs:

- `spikes/ecobee-hap-poc/package.json`, `package-lock.json`, `app.json`, `babel.config.js`, `tsconfig.json`
- `spikes/ecobee-hap-poc/App.tsx`
- `spikes/ecobee-hap-poc/src/application/`, `src/hap/ports/`, `src/diagnostics/`, `src/ui/`
- `spikes/ecobee-hap-poc/test/fakes/`, `test/foundation/`
- `implementation_evidence/ecobee-hap-poc/phase-01.md`

## Required implementation behavior

- Root package/lock/config/source remain byte-for-byte unchanged by this phase.
- Logger rejects unknown fields; secrets are not merely masked after arbitrary object serialization.
- Setup-code-shaped strings, key field names, IP/MAC addresses, and stable identifiers are caught by tests/scanner.
- UI exposes no arbitrary endpoint or raw protocol entry.
- Tests can inject time, cancellation, adapters, and logger without rendering native modules.

## Tests

- Unit tests for result classes, timeout/cancellation, logger allowlist/redaction, and evidence scanner.
- Render test proving the shell shows sanitized state and no raw console controls.
- Inspection that root `package.json` and root native configuration were not modified.

## Acceptance focus

- Foundation for `HAP-014`; no acceptance criterion is completed yet.

## Commands/checks

```sh
npm install --prefix spikes/ecobee-hap-poc
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-01.md`; record dependency versions, isolation inspection, tests, diagnostics/redaction results, and material files.

## Exit criteria

- [ ] Independent Android spike and required scripts exist.
- [ ] Typed ports/fakes and safe logger are tested.
- [ ] Production app dependency/native/source surfaces are unchanged.
- [ ] Evidence is complete and no later protocol work was pulled forward.

