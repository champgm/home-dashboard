# Home Dashboard 2.3.0 Draft Review

## Review status

**DRAFT — stakeholder review required**

The approved 2.2.0 baseline remains unchanged. The proposed 2.3.0 SRS/SAD add device-oriented Hue dimmer inspection and safe structured repair.

## Decisions to review

| Topic | Proposed contract |
|---|---|
| User model | A Dimmer Profile groups the bridge's low-level Sensor, Rule, Schedule, Resource Link, helper-Sensor, and target resources by physical control and gesture. |
| Rules tab | Individual Rule inspection and management remain available; the profile is an additional device-oriented view. |
| Identity | Group only from characterized stable Sensor metadata and exact references; never group by display name or substring matching. Ambiguity fails closed. |
| Event decoding | Decode only model/event combinations present in the model-specific catalog and retain raw values. Unknown events remain read-only. |
| Custom automation | Unsupported or partially parsed bindings remain visible and navigable but are never rewritten by the Dimmer Profile workflow. |
| External ownership | Show credential-safe provenance. Editing a recognized Rule created by another bridge client requires an additional takeover confirmation. |
| Editing | Structured templates cover characterized on/off, hold-to-brighten/dim, brightness/color, Scene activation, and Scene cycling. No raw JSON editor is added. |
| Preview | The user sees and confirms the complete ordered create/update/enable/disable/delete plan before any write. Deletes retain existing destructive confirmation requirements. |
| Concurrent change | A fresh preflight snapshot must contain unchanged versions of all affected resources; otherwise the operation aborts without writes and requires a new preview. |
| Partial completion | Hue V1 has no cross-resource transaction. On definite or ambiguous failure, stop dependent work, refresh, and report succeeded, failed/ambiguous, and unattempted operations. Do not automatically retry or roll back. |
| Persistence | The profile and mutation plan are derived from the current bridge snapshot and are not persisted as a competing source of truth. |

## Acceptance emphasis

- Same-name dimmers must not be combined.
- Malformed paths, missing targets, unsupported models/events, and custom Rules remain visible without becoming writable.
- No Hue owner credential appears in UI, logs, previews, or diagnostics.
- Disposable fixtures cover every supported template and every failure boundary before household automation is edited.
- Target acceptance uses the bedroom dimmer without changing unrelated production automations.

## Approval gate

After stakeholder revisions are resolved, change both 2.3.0 document statuses to `approved-implementation-baseline`, update this review result, and create a separately reviewable phased implementation plan before changing application code.
