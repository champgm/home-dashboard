# Phase 02 — HAP Source, Provider, and Governance Decision

Before implementation, read:

- `docs/ecobee-hap-poc/implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `docs/ecobee-hap-poc/implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `docs/ecobee-hap-poc/00_POC_CHARTER.md`
- `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`
- `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`
- `docs/ecobee-hap-poc/implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`
- `implementation_evidence/ecobee-hap-poc/phase-01.md`

**Prerequisite:** Phase 01.

## Objective

Freeze a reviewable HAP source/adaptation strategy and exact provider candidates before protocol code is copied or dependencies proliferate.

## Why this phase exists

Upstream provenance, license terms, transitive Node assumptions, cryptographic coverage, and maintenance boundaries can invalidate the approach. This bounded decision prevents later phases from silently becoming an unmaintainable fork.

## Authoritative requirements

- PRIMARY: `ARC-04`, `ARC-15`
- Supporting: `ARC-03`, `ARC-06`, `ARC-07`

## Relevant design sections

- `HAP controller core`
- `Discovery adapter`, `TCP adapter`, `Crypto adapter`
- `Production implications if the POC passes`

## In scope

- Pin and inventory the selected `hap-controller` reference version/commit and license.
- Identify the exact IP-only modules/tests to adapt and all Node/native assumptions to replace.
- Evaluate exact versions/licenses/maintenance signals for discovery, TCP, crypto, and secure-store candidates.
- Define upstream test provenance, local modification markers, update comparison procedure, and vulnerability-response owner.
- Record HAP specification-use terms separately from package licenses and state whether intended post-POC distribution needs authorization/certification review.
- Produce an accept/reject decision for each candidate; unresolved legal authority is recorded as blocking, not guessed.

## Explicitly out of scope

- Copying/adapting HAP implementation, installing native providers, or writing protocol/crypto code
- Legal conclusions beyond documented source terms and identified review needs

## Expected repository changes

Existing prerequisites: Phase 01 spike and evidence.

Expected outputs:

- `spikes/ecobee-hap-poc/docs/HAP_SOURCE_DECISION.md`
- `spikes/ecobee-hap-poc/docs/THIRD_PARTY_NOTICES.md`
- `spikes/ecobee-hap-poc/docs/UPSTREAM_UPDATE_PROCEDURE.md`
- `implementation_evidence/ecobee-hap-poc/phase-02.md`

## Required implementation behavior

- Distinguish observed facts, engineering inferences, and unresolved authorization questions.
- Do not treat Node compilation, package marketing, or package license as proof of Hermes compatibility or HAP distribution authorization.
- Exclude BLE/Noble and accessory/server modules.
- Every adopted source has an immutable version/commit and retained test provenance.

## Tests

- Mechanical dependency/license inventory.
- Inspection mapping each required HAP capability to a source module or planned local implementation phase.
- Inspection mapping each Node dependency to an existing port or explicit replacement.

## Acceptance focus

- PRIMARY: `HAP-017` (may remain `BLOCKED` if distribution authority requires an external decision).

## Commands/checks

```sh
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
npm --prefix spikes/ecobee-hap-poc audit --omit=dev
git diff --check
```

## Persisted implementation evidence

Create `implementation_evidence/ecobee-hap-poc/phase-02.md`; record exact versions/commits, license sources, decisions, rejected options, update path, and any governance blocker.

## Exit criteria

- [ ] Source/provider decision and provenance are explicit.
- [ ] Node/native replacement surface is bounded.
- [ ] Package and HAP specification-use questions are separately recorded.
- [ ] `HAP-017` is PASS or explicitly BLOCKED; no authority is invented.
- [ ] Evidence is complete and no protocol implementation was pulled forward.

