# Ecobee HAP POC — Results

## POC decision

- Decision: `NO-GO`
- Date: 2026-09-17
- Reviewers: Codex implementation run; human target operator review still required
- Target model/firmware: `TBD — not included in this status update`
- App commit/build: `TBD — isolated workspace implementation run`

### Critical result summary

- M1 protocol feasibility: `BLOCKED` by the failed Android crypto/runtime gate
- M2 local control: `BLOCKED`
- M3 dependability: `BLOCKED`
- Passed: deterministic wire, crypto-vector, credential, pairing-transcript, projection, write-reconciliation, lifecycle, cleanup, and evidence-hygiene checks; `HAP-009`, `HAP-014`, and `HAP-015`
- Failed: `HAP-016` Android Hermes crypto/runtime gate; the current SRP/Node-crypto path is incompatible with the React Native runtime
- Pending/blocked: target-gated `HAP-002` through `HAP-008`, `HAP-010` through `HAP-013`; governance `HAP-017`; physical reliability gate
- Target capabilities not exposed: `TBD — target capability/read phases remain unvalidated`
- Target-readiness repair: the shell now exposes the crypto vector runner, live Android Wi-Fi CIDR guarding, fail-closed discovery, and a sanitized persisted result sheet. HAP-001 live discovery is recorded `PASS`; the Android runtime gate remains `FAIL`, and the remaining target gates are still open.

### Sequencing caveat for Phases 10–17

Phases 10–17 contain speculative implementations or reconciliation completed before their physical prerequisites were closed. They are not target acceptance evidence. The target operator must validate them sequentially: M1/Phases 04–09, then M2/Phases 10–13, then M3/Phases 14–16, followed by Phase 17 reconciliation. The sanitized target-run sheet in the app records only allowlisted result categories and does not upgrade a criterion automatically.

### Dependability findings

- Pair/verify reliability: deterministic full transcript passes; physical pairing and twenty-cycle verification are `PENDING TARGET`
- Lifecycle and reconnect behavior: deterministic ordering/generation tests pass; physical interruption matrix is `PENDING TARGET`
- Event or polling decision: bounded foreground polling fallback is implemented; target measurements are `PENDING TARGET`
- WAN-denied behavior: `PENDING TARGET`; independent router/firewall proof was unavailable
- Soak-test result: `BLOCKED`; no physical target or WAN-denial environment

### Security and maintenance findings

- Credential handling: versioned protected store, staged/confirmed commit, explicit repair states, and separate cleanup operations are implemented and tested
- Crypto qualification: the initial gate is recorded `FAIL` on the SRP/Node-crypto path; the bounded quick-crypto remediation rerun loaded on the emulator and reported `7 passed · 0 failed`, but is not promoted over the recorded gate
- Dependency/license posture: versions, upstream provenance, and notices are recorded; the production-dependency audit reports 11 moderate transitive vulnerabilities and the available forced fix is breaking; HAP specification-use/distribution review is `BLOCKED` pending external authority
- Required fork/adaptation surface: narrow adapters around SRP, sodium primitives, DNS-SD, TCP, and secure storage; no full opaque HAP runtime is carried into the root app

### Conditions or blockers

- Physical target run / owner: POC operator / HAP-001 live discovery is recorded `PASS`; remaining required evidence is sanitized pairing, reads, writes, recovery, WAN denial, and soak records / due date: TBD
- Android Hermes development-build remediation / owner: POC operator / required evidence: `react-native-quick-crypto`-backed build and all seven vectors reporting `7 passed · 0 failed`; remediation result: `7 passed · 0 failed`; Phase 04 gate record remains `FAIL` / due date: TBD
- HAP specification-use and distribution authorization / owner: project legal/product authority / required evidence: written decision and update/vulnerability path / due date: TBD
- Dependency vulnerability remediation / owner: spike maintainer / required evidence: reviewed upgrade or accepted risk record without a forced breaking downgrade / due date: TBD
- Android backup/data-transfer inspection / owner: POC operator / required evidence: device audit / due date: TBD

### Recommended next action

- HAP-001 live discovery is recorded `PASS`. Do not start pairing until the failed Phase 04 gate is explicitly reviewed; retain the initial gate as `FAIL` despite the unpromoted `7 passed · 0 failed` remediation rerun.
- Do not modify the production app or specifications yet. After the crypto/runtime gate is repaired, continue with the approved pairing-ownership/restoration plan and router-controlled WAN-denial environment; then rerun the remaining target-gated phases in order.
- After a passing M3, revise the SRS/SAD explicitly for local discovery, HAP trust and credential lifecycle, supported thermostat capabilities, network policy, failure semantics, maintenance ownership, and distribution obligations.

## Acceptance matrix

The authoritative criterion-by-criterion record is [final-traceability-status.md](final-traceability-status.md). All 17 criteria have an explicit result there; HAP-001 is the recorded live target pass, while the remaining target-gated criteria are open.

## Verification summary

```text
python3 docs/ecobee-hap-poc/implementation_plan/validate_plan.py -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck                 -> PASS
npm --prefix spikes/ecobee-hap-poc run test:ci                   -> PASS (30 suites, 64 tests)
npm --prefix spikes/ecobee-hap-poc run audit:secrets             -> PASS
Android Hermes crypto/runtime gate (initial qualification)       -> FAIL (recorded gate result)
Android Hermes crypto/runtime remediation rerun                 -> 7 passed · 0 failed (not promoted; pairing not run; HAP-001 recorded separately)
```
