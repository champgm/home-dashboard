# Home Dashboard 2.4.0 Baseline Review

## Review status

**APPROVED — implementation baseline**

SRS 2.4.0 and SAD 2.4.0 supersede the draft 2.3.0 dimmer-management additions. The revision keeps the existing 2.2/2.3 protocol, privacy, visual, persistence, and household-simplification decisions while replacing production-style dimmer transaction machinery with a household-oriented editing workflow.

## Stakeholder context applied

Home Dashboard is used by two trusted family members to control one highly static household installation. It is not a production automation platform and does not need generalized ownership, transaction, or concurrent graph-editing machinery for ordinary dimmer changes.

This context is now locked by **DG-007** so later architecture reviews do not repeatedly reintroduce production-style dimmer complexity without an explicit stakeholder change.

## Corrected dimmer contract

| Topic | 2.4.0 baseline |
|---|---|
| Primary workflow | A recognized physical dimmer opens **Configure Dimmer**, organized by physical controls and gestures. |
| Normal information | Human-readable action and target. The user does not need to understand Sensor, Rule, Schedule, Resource Link, helper-resource, or raw Hue event identifiers. |
| Advanced information | Exact resource IDs/references, raw button-event values, helper resources, and credential-safe creator provenance remain inspectable. |
| Identity | Exact parsed references and characterized Sensor identity metadata only; no display-name grouping or serialized-substring matching. |
| Unsupported/custom automation | Visible but non-editable through Configure Dimmer; ordinary Sensor/Rule/resource editors remain available. |
| Simple edit | One recognized existing binding that maps to one Rule update saves directly on **Save** using changed-field semantics. No mutation-plan dialog, resource fingerprints, or additional owner/takeover confirmation. |
| Structural edit | Multi-resource/create/delete/replace work shows one concise planned-change list and requires confirmation. Delete confirmation remains separately mandatory. |
| Structural failure | Stop dependent work, authoritative refresh, show completed/failed-or-ambiguous/unattempted results, no automatic retry or rollback. |
| Persistence | No separate dimmer configuration, ownership DB, or transaction journal. Current Hue state remains authoritative. |
| Concurrency | No distributed locking between the two phones. Ordinary refresh reconciles external changes, consistent with the rest of the application. |

## Adversarial review

### 1. Does the simplified editor hide necessary Hue information?

**Pass.** Low-level information is not discarded. It moves to Advanced and ordinary resource editors remain available. HUE-008 full Rule management is unchanged.

### 2. Can a simple edit accidentally become a broad graph rewrite?

**Pass.** A `simple_dimmer_edit` is definitionally one existing recognized binding represented by one non-destructive Rule update. HUE-020 changed-field semantics still apply. Anything requiring multiple resource mutations is classified as structural.

### 3. Are destructive operations weakened?

**Pass.** Structural preview is not a replacement for deletion confirmation. UX-DEL-001 through UX-DEL-003 remain mandatory for every destructive operation.

### 4. Can custom or ambiguous automation be silently rewritten?

**Pass.** Exact reference parsing remains mandatory. Unknown models/events, malformed references, ambiguous device identities, and custom/unrecognized bindings are visible but non-editable through Configure Dimmer.

### 5. Does creator provenance expose the Hue API credential or create unnecessary household ceremony?

**Pass.** Creator provenance remains credential-safe and Advanced-only. A different creator alone does not add a second confirmation for a recognized simple edit. This is intentional for the two-trusted-user household under DG-007.

### 6. Is production-style conflict/recovery machinery still required?

**No; intentionally not selected.** Resource fingerprint preflight, a generalized `DimmerMutationPlan`, ownership-takeover workflow, and transactional automation-graph recovery are excluded by DG-007. For a structural operation, sequential execution plus stop/refresh/report is sufficient. For an ordinary simple edit, the existing single-Hue-mutation and refresh behavior is used.

### 7. Is the actual household dimmer sufficiently characterized today?

**Target-gated, not a document blocker.** The repository does not yet contain a sanitized fixture captured from the actual household dimmer. AC-HUE-021 explicitly requires that read-only characterization during implementation acceptance. The baseline does not guess model/event values; unsupported or unknown forms fail closed until cataloged.

### 8. Does the change weaken full Hue V1 management?

**Pass.** No. Sensor and Rule editors remain available and HUE-004 through HUE-010 are unchanged. Configure Dimmer is an easier projection/editor for recognized household dimmer behavior, not a replacement for underlying resource management.

## Mechanical validation

`validate_home_dashboard_docs_2.4.0.py` checks:

- document version/status/companion consistency;
- unique requirement and acceptance IDs;
- complete SRS acceptance traceability;
- complete SAD requirement coverage;
- preservation of the 2.0–2.2 simplification/provisioning/visual contracts;
- DG-007 presence;
- direct simple-edit and structural-edit requirements;
- absence of the old generalized dimmer graph/planner types and services from the selected architecture;
- target-gated household dimmer characterization acceptance.

Validation result:

```text
requirements=90
acceptance=90
sad_covered_requirements=90
runtime_components=11
architectural_decisions=22
errors=0
warnings=0
```

## Residual risks / accepted limitations

- A dimmer model/event form not yet cataloged remains Advanced/read-only until characterized.
- Two phones can race on the same Rule; there is no distributed lock. The last bridge write wins and ordinary refresh reconciles state.
- Custom automations may still require the ordinary Rule/resource editors.
- Structural Hue multi-resource changes are not atomic; stop-and-refresh behavior remains the recovery model.

These are appropriate for the stated household deployment and are not implementation blockers.

## Readiness conclusion

**SRS_2.4.0.yaml and SAD_2.4.0.yaml are mutually consistent and ready for implementation planning.**

The implementation plan should treat household-dimmer characterization as target-gated work and should prioritize the simple Configure Dimmer path before structural multi-resource editing.
