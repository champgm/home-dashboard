# Phase 11 — Target Acceptance and Release Closure

## Objective

Execute the authoritative acceptance work that cannot be proven by local automation and make the final release decision from captured evidence.

## Ownership

- Primary closure: no new canonical local defect; close all remaining `PENDING TARGET` acceptance records
- Authority: the target-dependent subset generated from all 88 SRS acceptance criteria
- Dependencies: phases 01–10 locally implemented and evidence-reconciled; Phase 08 model verification remains open

## Preconditions

- No open `FAIL — LOCAL` or `PARTIAL — LOCAL` item.
- Signed candidate APK/build is reproducible and uniquely identified.
- Test inventory identifies Pixel/API levels, Hue Bridge/firmware and disposable resources, TP-Link models, LAN/WAN conditions, and backup location.
- Bridge configuration backup and cleanup/rollback procedures have been rehearsed.

## Execution matrix

1. Install and exercise the signed candidate on the required Pixel/API-level phones, including rotation, process recreation, foreground/background transitions, and accessibility checks.
2. Exercise all Hue resource workflows against a real bridge using disposable lights/groups/scenes/sensors/rules/schedules/resource links where physically possible; record created IDs and cleanup.
3. Verify sensor/dimmer inspection and repair against the bedroom dimmer scenario without modifying unrelated production automations.
4. Exercise TP-Link discovery, control, reachability presentation, and energy behavior on each required supported/non-supported model.
5. Repeat required workflows with WAN unavailable while LAN remains available and prove no cloud dependency.
6. Execute ambiguous-network scenarios with controlled interruption and confirm read-back/no-retry behavior from user-visible results and sanitized logs.
7. Inspect release artifacts, backups, logs, screenshots, and exported evidence for secrets and sensitive identifiers; redact where required without destroying auditability.
8. Run backup/restore and cleanup verification, confirming every disposable target resource was removed or restored.

## Evidence requirements

For every target criterion record device/model, OS/API or firmware, app build/hash, timestamp, network condition, exact action, expected result, actual result, and artifact link. A screenshot alone is insufficient when logs/state comparison are required.

## Exit criteria

- Every target-dependent acceptance criterion passes with attributable evidence.
- All disposable device/bridge state is cleaned up and backup integrity is confirmed.
- The full common quality gate passes against the exact signed-release source revision.
- The canonical register contains no open nonconformance and final traceability reports 88/88 requirements and 88/88 acceptance criteria without failures or blockers.
- If any check fails, release remains nonconformant and a new or reopened canonical item records the failure; the phase cannot be declared complete.
