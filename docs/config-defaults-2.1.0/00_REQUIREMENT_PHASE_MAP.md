# Configuration Defaults Change — Requirement / Phase Map

This is a **change-scope ownership map**, not a replacement for the full project traceability matrix in the SRS.

Phase 01 revises the authoritative requirements from 2.0.0 to 2.1.0. The listed stable IDs should be preserved unless the SRS review finds that a new ID is required. If a new mandatory requirement is introduced in Phase 01, update this map before Phase 01 exits.

## Primary implementation ownership

| Requirement | 2.1.0 intent for this change | Primary phase |
|---|---|---:|
| `HUE-001` | GUI-configurable permanent bridge IPv4 may resolve from a bundled default when no phone-local override exists | 05 |
| `HUE-012` | Hue runtime still uses only the effective configured private IPv4 + protected credential | 05 |
| `TPL-002` | Effective plug endpoint remains GUI-configurable by IPv4/port | 06 |
| `TPL-009` | Bundled plug defaults participate on every valid load; user overrides/additions/removals win and survive upgrades | 06 |
| `CON-005` | Each phone's overlay remains independent; no configuration synchronization | 07 |
| `DATA-001` | Persist phone-local user configuration intent plus Favorites/settings across restarts; effective config resolves from defaults + persisted user state | 04 |
| `DATA-002` | Updates preserve explicit user choices while allowing new/changed defaults to apply only where not overridden/removed | 07 |
| `DATA-003` | Corrupt persisted user state must not be overwritten or treated as an empty overlay; defaults appear only after explicit reset | 04 |
| `DATA-005` | Storage I/O failure must not be treated as absence or permission to resolve an empty overlay | 04 |

## Supporting requirements that must not regress

- `SEC-001` — protected Hue `{bridgeId, credential}` remains outside non-secret configuration and survives Reset Local Configuration.
- `CON-002` / permanent single-bridge guardrail — bundled bridge IP does not create bridge-switching behavior.
- `CON-010` — bundled/default endpoints remain literal private/local IPv4 values.
- `TPL-010` — removing a plug default affects only phone-local configuration; it does not reconfigure the physical plug.
- `PRIV-001`, `PRIV-002`, `PRIV-004` — no sync/cloud/telemetry and no backup regression.

## Acceptance coverage

| Criterion | Main phase(s) |
|---|---|
| `AC-HUE-001` | 05, 07 |
| `AC-TPL-002` | 06 |
| `AC-TPL-009` | 06, 07 |
| `AC-CON-005` | 07 |
| `AC-DATA-001` | 04, 07 |
| `AC-DATA-002` | 07 |
| `AC-DATA-003` | 04, 07 |
| `AC-DATA-005` | 04, 07 |
| `AC-HUE-017` | 05, 07 — only the Reset Local Configuration / protected-binding portion |

Phase 01 must update the wording of affected acceptance criteria so they objectively cover defaults/overrides/removals across app-update generations.

## Required update matrix used by Phases 02–07

For a bundled field or plug endpoint, effective resolution follows this precedence:

```text
explicit user removal (where removal is supported)
    > explicit user override
    > bundled default
    > absent
```

For user-added plug endpoints that have no bundled identity:

```text
persisted user addition > absent
```

A corrupt/unreadable overlay is **not** equivalent to an empty overlay and therefore does not enter this resolution matrix until the user explicitly resets local configuration.
