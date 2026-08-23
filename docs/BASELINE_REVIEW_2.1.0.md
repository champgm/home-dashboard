# Home Dashboard 2.1.0 Baseline Review

## Review result

**APPROVED — approved-implementation-baseline**

The 2.1.0 SRS and SAD revise only the configuration-defaults persistence contract. The existing Hue V1, TP-Link legacy protocol, foreground-only runtime, privacy, backup, and permanent-single-bridge decisions remain authoritative.

## Adversarial review

| Scenario | Required outcome | Baseline disposition |
|---|---|---|
| Default generation A → B | Untouched fields follow B; explicit overrides/removals remain authoritative; additions survive | Defined in SRS/SAD and acceptance criteria |
| Seed edited on phone | Stable plug ID remains; endpoint override wins | Defined |
| Seed removed on phone | Removal tombstone prevents resurrection | Defined |
| User-added plug | Remains independent of bundled defaults and survives updates | Defined |
| Bridge override | Phone-local override wins over later bundled bridge value | Defined |
| Corrupt persisted state | Fail closed; no empty-overlay/default resolution or overwrite | Defined |
| Storage read/write failure | Distinct I/O failure; no automatic default resolution | Defined |
| Reset Local Configuration | Empty non-secret overlay resolves current APK defaults | Defined |
| Protected HueBinding | `{bridgeId, credential}` remains in SecureStore and survives reset | Preserved |
| Two phones | Independent local overlays; no synchronization | Preserved and strengthened |

## Architecture decision

The selected mechanism is a sparse v2 AsyncStorage user overlay resolved at load time against immutable bundled TypeScript defaults. Version-1 materialized configuration is migrated by stable plug ID. No database, cloud sync, remote journal, bridge switching, or protocol change is introduced.

The repository does not contain the household Hue bridge IPv4 address. The implementation therefore supports an optional validated bundled bridge value but does not invent a network destination; the household build can set it when the address is supplied.

## Validation

```text
python3 docs/validate_home_dashboard_docs_2.1.0.py
requirements=85
acceptance=85
sad_covered_requirements=85
errors=0
```

