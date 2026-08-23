# Mandatory Requirement → Primary Implementation Phase Map

This is an implementation-ownership index for `SRS_2.0.0.yaml`. It does **not** replace the SRS verification traceability matrix.

Rules:

- Every mandatory SRS requirement/constraint has exactly one **PRIMARY** phase owner below.
- Other phases may list the same requirement as supporting work; that does not change primary ownership.
- The primary owner is accountable for ensuring the requirement is implemented or deliberately handed to a later integration phase with explicit evidence. Phase 27 verifies all requirements again.
- If a requirement needs a different implementation mechanism than the SAD specifies, stop and revise the SAD rather than changing ownership semantics here.

| Requirement | SRS category | Primary phase | Phase | SRS acceptance |
|---|---|---:|---|---|
| `CON-001` | constraints | 01 | [Modern App Foundation](./01_MODERN_APP_FOUNDATION.md) | `AC-CON-001` |
| `CON-002` | constraints | 23 | [Hue Initial Provisioning](./23_HUE_INITIAL_PROVISIONING.md) | `AC-CON-002` |
| `CON-003` | constraints | 01 | [Modern App Foundation](./01_MODERN_APP_FOUNDATION.md) | `AC-CON-003` |
| `CON-004` | constraints | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-CON-004` |
| `CON-005` | constraints | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-CON-005` |
| `CON-006` | constraints | 16 | [Foreground Lifecycle and Polling](./16_FOREGROUND_LIFECYCLE_AND_POLLING.md) | `AC-CON-006` |
| `CON-007` | constraints | 27 | [Final End-to-End Acceptance and Traceability Closure](./27_FINAL_END_TO_END_ACCEPTANCE.md) | `AC-CON-007` |
| `CON-008` | constraints | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-CON-008` |
| `CON-009` | constraints | 13 | [TP-Link Legacy Transport and Pixel Device Spike](./13_TPLINK_TRANSPORT_AND_DEVICE_SPIKE.md) | `AC-CON-009` |
| `CON-010` | constraints | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-CON-010` |
| `FR-001` | functional | 16 | [Foreground Lifecycle and Polling](./16_FOREGROUND_LIFECYCLE_AND_POLLING.md) | `AC-FR-001` |
| `FR-002` | functional | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-FR-002` |
| `FR-003` | functional | 16 | [Foreground Lifecycle and Polling](./16_FOREGROUND_LIFECYCLE_AND_POLLING.md) | `AC-FR-003` |
| `FR-004` | functional | 16 | [Foreground Lifecycle and Polling](./16_FOREGROUND_LIFECYCLE_AND_POLLING.md) | `AC-FR-004` |
| `FR-005` | functional | 17 | [Navigation, Favorites, and Shared Resource UI](./17_NAVIGATION_FAVORITES_SHARED_UI.md) | `AC-FR-005` |
| `FR-006` | functional | 17 | [Navigation, Favorites, and Shared Resource UI](./17_NAVIGATION_FAVORITES_SHARED_UI.md) | `AC-FR-006` |
| `FR-007` | functional | 17 | [Navigation, Favorites, and Shared Resource UI](./17_NAVIGATION_FAVORITES_SHARED_UI.md) | `AC-FR-007` |
| `FR-008` | functional | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-FR-008` |
| `FR-009` | functional | 20 | [Scenes and Sensors UI](./20_SCENES_SENSORS_UI.md) | `AC-FR-009` |
| `FR-010` | functional | 17 | [Navigation, Favorites, and Shared Resource UI](./17_NAVIGATION_FAVORITES_SHARED_UI.md) | `AC-FR-010` |
| `FR-011` | functional | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-FR-011` |
| `FR-012` | functional | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-FR-012` |
| `FR-013` | functional | 25 | [Plug UI, Endpoint Administration, and Editor Contract Audit](./25_PLUG_UI_AND_EDITOR_CONTRACT.md) | `AC-FR-013` |
| `FR-014` | functional | 18 | [Destructive Action Confirmation and Cleanup](./18_DESTRUCTIVE_ACTIONS.md) | `AC-FR-014` |
| `FR-015` | functional | 17 | [Navigation, Favorites, and Shared Resource UI](./17_NAVIGATION_FAVORITES_SHARED_UI.md) | `AC-FR-015` |
| `FR-016` | functional | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-FR-016` |
| `HUE-001` | hue | 23 | [Hue Initial Provisioning](./23_HUE_INITIAL_PROVISIONING.md) | `AC-HUE-001` |
| `HUE-002` | hue | 23 | [Hue Initial Provisioning](./23_HUE_INITIAL_PROVISIONING.md) | `AC-HUE-002` |
| `HUE-003` | hue | 05 | [Hue Snapshot and Compatibility Fixtures](./05_HUE_SNAPSHOT_AND_COMPATIBILITY.md) | `AC-HUE-003` |
| `HUE-004` | hue | 06 | [Hue Lights and Groups Protocol](./06_HUE_LIGHTS_GROUPS_PROTOCOL.md) | `AC-HUE-004` |
| `HUE-005` | hue | 06 | [Hue Lights and Groups Protocol](./06_HUE_LIGHTS_GROUPS_PROTOCOL.md) | `AC-HUE-005` |
| `HUE-006` | hue | 07 | [Hue Scenes Protocol](./07_HUE_SCENES_PROTOCOL.md) | `AC-HUE-006` |
| `HUE-007` | hue | 08 | [Hue Sensors and Search Protocol](./08_HUE_SENSORS_SEARCH_PROTOCOL.md) | `AC-HUE-007` |
| `HUE-008` | hue | 09 | [Hue Rules Protocol and Catalog](./09_HUE_RULES_PROTOCOL.md) | `AC-HUE-008` |
| `HUE-009` | hue | 10 | [Hue Schedules Protocol and Catalog](./10_HUE_SCHEDULES_PROTOCOL.md) | `AC-HUE-009` |
| `HUE-010` | hue | 12 | [Hue Resource Links and Read-only Bridge Administration](./12_HUE_RESOURCE_LINKS_AND_BRIDGE_READS.md) | `AC-HUE-010` |
| `HUE-011` | hue | 12 | [Hue Resource Links and Read-only Bridge Administration](./12_HUE_RESOURCE_LINKS_AND_BRIDGE_READS.md) | `AC-HUE-011` |
| `HUE-012` | hue | 04 | [Hue V1 Transport Core](./04_HUE_TRANSPORT_CORE.md) | `AC-HUE-012` |
| `HUE-013` | hue | 04 | [Hue V1 Transport Core](./04_HUE_TRANSPORT_CORE.md) | `AC-HUE-013` |
| `HUE-014` | hue | 04 | [Hue V1 Transport Core](./04_HUE_TRANSPORT_CORE.md) | `AC-HUE-014` |
| `HUE-015` | hue | 08 | [Hue Sensors and Search Protocol](./08_HUE_SENSORS_SEARCH_PROTOCOL.md) | `AC-HUE-015` |
| `HUE-016` | hue | 11 | [Hue Action Policy and Partial-Update Enforcement](./11_HUE_ACTION_POLICY_AND_PARTIAL_UPDATES.md) | `AC-HUE-016` |
| `HUE-017` | hue | 23 | [Hue Initial Provisioning](./23_HUE_INITIAL_PROVISIONING.md) | `AC-HUE-017` |
| `HUE-018` | hue | 24 | [Hue Same-Bridge Reauthorization](./24_HUE_SAME_BRIDGE_REAUTHORIZATION.md) | `AC-HUE-018` |
| `HUE-019` | hue | 24 | [Hue Same-Bridge Reauthorization](./24_HUE_SAME_BRIDGE_REAUTHORIZATION.md) | `AC-HUE-019` |
| `HUE-020` | hue | 11 | [Hue Action Policy and Partial-Update Enforcement](./11_HUE_ACTION_POLICY_AND_PARTIAL_UPDATES.md) | `AC-HUE-020` |
| `TPL-001` | tplink | 13 | [TP-Link Legacy Transport and Pixel Device Spike](./13_TPLINK_TRANSPORT_AND_DEVICE_SPIKE.md) | `AC-TPL-001` |
| `TPL-002` | tplink | 25 | [Plug UI, Endpoint Administration, and Editor Contract Audit](./25_PLUG_UI_AND_EDITOR_CONTRACT.md) | `AC-TPL-002` |
| `TPL-003` | tplink | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-TPL-003` |
| `TPL-004` | tplink | 13 | [TP-Link Legacy Transport and Pixel Device Spike](./13_TPLINK_TRANSPORT_AND_DEVICE_SPIKE.md) | `AC-TPL-004` |
| `TPL-005` | tplink | 14 | [TP-Link Plug Feature Protocol](./14_TPLINK_FEATURE_PROTOCOL.md) | `AC-TPL-005` |
| `TPL-006` | tplink | 14 | [TP-Link Plug Feature Protocol](./14_TPLINK_FEATURE_PROTOCOL.md) | `AC-TPL-006` |
| `TPL-007` | tplink | 25 | [Plug UI, Endpoint Administration, and Editor Contract Audit](./25_PLUG_UI_AND_EDITOR_CONTRACT.md) | `AC-TPL-007` |
| `TPL-008` | tplink | 14 | [TP-Link Plug Feature Protocol](./14_TPLINK_FEATURE_PROTOCOL.md) | `AC-TPL-008` |
| `TPL-009` | tplink | 25 | [Plug UI, Endpoint Administration, and Editor Contract Audit](./25_PLUG_UI_AND_EDITOR_CONTRACT.md) | `AC-TPL-009` |
| `TPL-010` | tplink | 25 | [Plug UI, Endpoint Administration, and Editor Contract Audit](./25_PLUG_UI_AND_EDITOR_CONTRACT.md) | `AC-TPL-010` |
| `TPL-011` | tplink | 13 | [TP-Link Legacy Transport and Pixel Device Spike](./13_TPLINK_TRANSPORT_AND_DEVICE_SPIKE.md) | `AC-TPL-011` |
| `UX-DEL-001` | destructive_actions | 18 | [Destructive Action Confirmation and Cleanup](./18_DESTRUCTIVE_ACTIONS.md) | `AC-UX-DEL-001` |
| `UX-DEL-002` | destructive_actions | 18 | [Destructive Action Confirmation and Cleanup](./18_DESTRUCTIVE_ACTIONS.md) | `AC-UX-DEL-002` |
| `UX-DEL-003` | destructive_actions | 18 | [Destructive Action Confirmation and Cleanup](./18_DESTRUCTIVE_ACTIONS.md) | `AC-UX-DEL-003` |
| `DATA-001` | data_and_persistence | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-DATA-001` |
| `DATA-002` | data_and_persistence | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-DATA-002` |
| `DATA-003` | data_and_persistence | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-DATA-003` |
| `DATA-004` | data_and_persistence | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-DATA-004` |
| `DATA-005` | data_and_persistence | 02 | [Local Configuration and Endpoint Validation](./02_LOCAL_CONFIG_AND_ENDPOINT_VALIDATION.md) | `AC-DATA-005` |
| `PRIV-001` | privacy | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-PRIV-001` |
| `PRIV-002` | privacy | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-PRIV-002` |
| `PRIV-003` | privacy | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-PRIV-003` |
| `PRIV-004` | privacy | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-PRIV-004` |
| `SEC-001` | security | 03 | [Protected Hue Binding Store](./03_PROTECTED_HUE_BINDING.md) | `AC-SEC-001` |
| `SEC-002` | security | 04 | [Hue V1 Transport Core](./04_HUE_TRANSPORT_CORE.md) | `AC-SEC-002` |
| `SEC-003` | security | 04 | [Hue V1 Transport Core](./04_HUE_TRANSPORT_CORE.md) | `AC-SEC-003` |
| `SEC-004` | security | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-SEC-004` |
| `SEC-005` | security | 26 | [Android Release, Privacy, and Security Hardening](./26_ANDROID_RELEASE_PRIVACY_SECURITY.md) | `AC-SEC-005` |
| `SEC-006` | security | 05 | [Hue Snapshot and Compatibility Fixtures](./05_HUE_SNAPSHOT_AND_COMPATIBILITY.md) | `AC-SEC-006` |
| `REL-001` | runtime_and_failure_semantics | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-REL-001` |
| `REL-002` | runtime_and_failure_semantics | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-REL-002` |
| `REL-003` | runtime_and_failure_semantics | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-REL-003` |
| `REL-004` | runtime_and_failure_semantics | 18 | [Destructive Action Confirmation and Cleanup](./18_DESTRUCTIVE_ACTIONS.md) | `AC-REL-004` |
| `REL-005` | runtime_and_failure_semantics | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-REL-005` |
| `REL-006` | runtime_and_failure_semantics | 15 | [Command Orchestration and Device State](./15_COMMAND_ORCHESTRATION_AND_STATE.md) | `AC-REL-006` |
| `REL-007` | runtime_and_failure_semantics | 16 | [Foreground Lifecycle and Polling](./16_FOREGROUND_LIFECYCLE_AND_POLLING.md) | `AC-REL-007` |
| `QA-001` | quality_attributes | 27 | [Final End-to-End Acceptance and Traceability Closure](./27_FINAL_END_TO_END_ACCEPTANCE.md) | `AC-QA-001` |
| `QA-002` | quality_attributes | 27 | [Final End-to-End Acceptance and Traceability Closure](./27_FINAL_END_TO_END_ACCEPTANCE.md) | `AC-QA-002` |
| `QA-003` | quality_attributes | 01 | [Modern App Foundation](./01_MODERN_APP_FOUNDATION.md) | `AC-QA-003` |

## Mechanical ownership summary

- Mandatory requirements: **85**
- Requirements with exactly one primary phase: **85**
- Duplicate primary owners: **0**
- Missing primary owners: **0**
