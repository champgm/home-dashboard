# Ecobee Local HAP POC — Requirement-to-Phase Map

## Purpose

This is an implementation-ownership index. It does not replace the charter, technical design, or acceptance matrix.

Because this POC intentionally has no production SRS/SAD revision, the IDs below are stable plan aliases for existing mandatory statements. They add no requirements:

- `OBJ-*` aliases the numbered objectives in `docs/ecobee-hap-poc/00_POC_CHARTER.md`.
- `SAFE-*` aliases the safety/security bullets in that charter.
- `PAIR-*` aliases its pairing-ownership prerequisite.
- `ARC-*` aliases mandatory architectural constraints in `docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md`.
- `HAP-*` IDs already exist in `docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md`.

Every `OBJ`, `SAFE`, `PAIR`, and `ARC` item has exactly one PRIMARY implementation phase. Other phases may verify or consume it.

## Mandatory objective ownership

| ID | Source obligation (summary) | PRIMARY phase |
|---|---|---|
| OBJ-01 | Discover target through `_hap._tcp` without configured IP | 05 |
| OBJ-02 | Show only necessary redacted discovery metadata | 05 |
| OBJ-03 | Explicit HAP Pair Setup with setup code | 07 |
| OBJ-04 | Store controller identity/pairing credentials in protected storage | 03 |
| OBJ-05 | Cold-start Pair Verify without pairing again | 08 |
| OBJ-06 | Enumerate accessories, services, and characteristics | 09 |
| OBJ-07 | Identify/read target-exposed thermostat capabilities | 09 |
| OBJ-08 | Safe capability-appropriate setpoint write with authoritative confirmation | 10 |
| OBJ-09 | Decide reliable events versus bounded polling | 11 |
| OBJ-10 | Recover from lifecycle, TCP, restart, address, and Wi-Fi changes | 12 |
| OBJ-11 | Repeat local control with thermostat WAN denied | 13 |
| OBJ-12 | Produce sanitized go/no-go evidence | 17 |

## Mandatory safety ownership

| ID | Source obligation (summary) | PRIMARY phase |
|---|---|---|
| SAFE-01 | Never log HAP secrets or sensitive payloads | 01 |
| SAFE-02 | No real credentials/stable household IDs in committed artifacts | 01 |
| SAFE-03 | Connect only to selected locally discovered HAP endpoint | 05 |
| SAFE-04 | No general-purpose TCP/HTTP/characteristic console | 01 |
| SAFE-05 | Explicit user action for pair, unpair, and writes | 07 |
| SAFE-06 | Operator-approved occupied-safe write range | 10 |
| SAFE-07 | Possible-send failures remain ambiguous until read-back | 10 |
| SAFE-08 | No uncontrolled Pair Setup retries | 07 |
| SAFE-09 | Explain unpair versus local credential deletion consequences | 15 |
| SAFE-10 | No association removal/reset/config change without approval/restoration | 07 |

## Mandatory pairing-ownership ownership

| ID | Source obligation (summary) | PRIMARY phase |
|---|---|---|
| PAIR-01 | Determine and record existing HomeKit association state | 05 |
| PAIR-02 | Record restoration steps and obtain approval before disruption | 07 |
| PAIR-03 | Avoid factory reset and HVAC configuration disturbance | 07 |
| PAIR-04 | Verify safe local thermostat operation after association change | 07 |
| PAIR-05 | Keep accessory-side removal, local deletion, and prior-association restoration explicit and distinct | 15 |

## Mandatory architecture ownership

| ID | Design section / constraint (summary) | PRIMARY phase |
|---|---|---|
| ARC-01 | Separate Expo app; do not modify root app dependency/native surfaces | 01 |
| ARC-02 | Minimal predefined UI with masked setup input and sanitized state | 01 |
| ARC-03 | Adapterized IP HAP core; no UI imports, BLE, or server behavior | 06 |
| ARC-04 | Pin/provenance upstream code and maintain an update path | 02 |
| ARC-05 | DNS-SD dedupe, removal/address/interface handling, paired identity | 05 |
| ARC-06 | Bounded cancellable TCP plus correct HTTP/TLV/encrypted record streaming | 06 |
| ARC-07 | Exact qualified crypto primitives; no insecure fallback | 04 |
| ARC-08 | Versioned protected records with explicit corrupt/repair states | 03 |
| ARC-09 | Generation-safe connection state and single active pairing/verify operation | 08 |
| ARC-10 | Persist only confirmed pairing; explicit indeterminate repair behavior | 07 |
| ARC-11 | Capability-aware writes, freshness, confirmation, and no replay | 10 |
| ARC-12 | Event/polling measurement and foreground lifecycle observation policy | 11 |
| ARC-13 | Local-link/interface endpoint policy; IPv4 first; no routing machinery | 05 |
| ARC-14 | Structured redacted diagnostics and evidence hygiene | 01 |
| ARC-15 | Separate HAP specification-use/distribution governance decision | 02 |

Mandatory plan obligations assigned: **42** (`12 OBJ + 10 SAFE + 5 PAIR + 15 ARC`).

## Acceptance ownership and coverage

| Acceptance ID | PRIMARY evidence phase | Supporting/final phases |
|---|---|---|
| HAP-001 | 05 | 13, 17 |
| HAP-002 | 05 | 12, 17 |
| HAP-003 | 07 | 14, 15, 17 |
| HAP-004 | 08 | 12, 13, 17 |
| HAP-005 | 08 | 16, 17 |
| HAP-006 | 09 | 17 |
| HAP-007 | 09 | 13, 16, 17 |
| HAP-008 | 10 | 13, 16, 17 |
| HAP-009 | 10 | 12, 14, 17 |
| HAP-010 | 11 | 12, 16, 17 |
| HAP-011 | 12 | 13, 14, 16, 17 |
| HAP-012 | 13 | 16, 17 |
| HAP-013 | 13 | 16, 17 |
| HAP-014 | 15 | 17 |
| HAP-015 | 14 | 15, 17 |
| HAP-016 | 04 | 07, 08, 17 |
| HAP-017 | 02 | 17 |

Acceptance criteria covered: **17 of 17**.

## Milestone ownership

| Milestone | Decision phase | Required prior phases |
|---|---|---|
| M1 — Protocol feasibility | 09 | 01–08 |
| M2 — Local control | 13 | M1 and 10–12 |
| M3 — Dependability | 17 | M2 and 14–16 |
