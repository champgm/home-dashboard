# Requirement and Nonconformance Phase Map

This map is the execution index for the rectification plan. The SRS/SAD and canonical nonconformance register remain authoritative.

## Primary ownership

| Nonconformance | Primary phase | Required outcome |
|---|---:|---|
| `NC-TRACE-001` | 01 | Exact and reproducible baseline coverage |
| `NC-TRACE-002` | 01 | Valid evidence links and anchors |
| `NC-HUE-001` | 02 | Shared typed Hue V1 resource catalog |
| `NC-HUE-008` | 02 | Changed-field-only Hue updates |
| `NC-HUE-002` | 03 | Complete light management |
| `NC-HUE-003` | 03 | Complete group management |
| `NC-HUE-004` | 04 | Complete scene management |
| `NC-HUE-005` | 05 | Complete sensor management |
| `NC-HUE-009` | 05 | Search feedback and foreground polling |
| `NC-HUE-006` | 06 | Structured rule management and dimmer repair |
| `NC-HUE-007` | 07 | Structured schedule management |
| `NC-TPL-001` | 08 | Required plug information display |
| `NC-TPL-002` | 08 | Energy retrieval and display |
| `NC-REL-001` | 09 | Single safe read-back after ambiguous Hue writes |
| `NC-EVID-001` | 10 | Phase evidence reconciled to implemented behavior |
| `NC-EVID-002` | 10 | Local failures separated from target dependencies |

## Requirement and acceptance allocation

| Requirement | Acceptance criterion | Primary phase | Supporting phase(s) | Verification focus |
|---|---|---:|---:|---|
| `FR-013` | `AC-FR-013` | 02 | 03–07 | Full safe Hue V1 resource management |
| `HUE-004` | `AC-HUE-004` | 03 | 02 | Light fields, validation, update behavior |
| `HUE-005` | `AC-HUE-005` | 03 | 02 | Group membership, class, actions, creation |
| `HUE-006` | `AC-HUE-006` | 04 | 02 | GroupScene/LightScene editing and activation |
| `HUE-007` | `AC-HUE-007` | 05 | 02, 06 | Sensor inspection, configuration, creation |
| `HUE-008` | `AC-HUE-008` | 06 | 02 | Rule conditions/actions and safe lifecycle |
| `HUE-009` | `AC-HUE-009` | 07 | 02 | Schedule time patterns and commands |
| `HUE-015` | `AC-HUE-015` | 05 | — | Search feedback and active-search polling lifecycle |
| `HUE-016` | `AC-HUE-016` | 06 | 05, 07 | Existing dangerous automation inspection/disable/delete |
| `HUE-020` | `AC-HUE-020` | 02 | 03–07 | Partial updates and changed-field serializers |
| `TPL-005` | `AC-TPL-005` | 08 | — | Plug identity, radio, relay, and feature details |
| `TPL-008` | `AC-TPL-008` | 08 | — | Capability-gated energy information |
| `REL-003` | `AC-REL-003` | 09 | 02–07 | Ambiguous outcome read-back without unsafe retry |

Phase 11 reruns all acceptance criteria that require physical devices, target OS behavior, packaging, security inspection, or network conditions.

## Dependency rationale

- Phase 01 makes later evidence mechanically trustworthy.
- Phase 02 establishes the typed catalog, validation, serialization, and mutation boundary used by all Hue editors.
- Phases 03–07 add resource-specific workflows on that boundary; rules follow sensors because dimmer repair depends on sensor metadata and events.
- Phase 08 is independent of Hue resource editing but precedes the unified local audit.
- Phase 09 is delayed until observable state and resource-specific update paths exist, so read-back can reconcile safely.
- Phase 10 freezes local truth before target execution; phase 11 must not conceal locally reproducible defects.
