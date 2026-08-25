# Home Dashboard 2.2.0 Baseline Review

## Review result

**APPROVED — approved-implementation-baseline**

The 2.2.0 remediation baseline keeps the 2.1.0 protocol, persistence, privacy, and permanent-single-bridge decisions intact
and makes the provisioning route, current diagnostics, Android safe-area behavior, and established legacy dashboard tile grammar
authoritative.

## Adversarial review

| Scenario | Required outcome | Baseline disposition |
|---|---|---|
| Hue link-button create-user | Exactly one unauthenticated `POST /api` with the devicetype JSON body; authenticated `/api/<credential>/config` verification follows | Defined in SRS/SAD and transport acceptance tests |
| Link button not pressed | Hue protocol rejection remains distinguishable from network/timeout failures | Defined in `REL-006` and `AC-HUE-002` |
| Provisioning detail | Category, operation, bounded safe detail, and storage failures survive to the UI without credential-bearing paths | Defined in `REL-006`, `SEC-002`, and the diagnostic model |
| Diagnostic flood | One current Hue bridge diagnostic and one per plug endpoint; success clears the relevant entry | Defined in `REL-008`, `AC-REL-008`, and ADR-019 |
| Status-bar overlap | Dashboard applies the top system inset once; native-stack headers are not double-inset | Defined in `QA-001`, `AC-QA-001`, and ADR-020 |
| Legacy tile contract | Responsive square raised tiles, Solarized states, retained image assets, full-tile Unknown image, and no inline Delete | Defined in `UX-VIS-001`, `AC-UX-VIS-001`, and ADR-021 |
| Legacy dense composition | Configured collections use legacy-derived compact wrapping geometry with independent corner controls remaining unclipped | Defined in `UX-VIS-002`, `AC-UX-VIS-002`, and ADR-021 |
| Delete capability | Dashboard tiles have no destructive action; existing Hue editors and plug administration retain confirmation-gated deletion | Preserved under `UX-DEL-001..003` |
| Security boundary | No credential, username, raw payload, or credential-bearing URL is rendered or logged | Preserved and strengthened by bounded diagnostics |

## Architecture decision

The selected implementation uses the existing `HueHttpTransport`, `ApplicationService`, React Navigation 7 stack/top-tabs,
`react-native-safe-area-context`, and a single `LegacyResourceButton` wrapper around the maintained
`@rcaferati/react-native-awesome-button` package, subject to the target compatibility gate. It does not reintroduce the obsolete
`react-native-really-awesome-button` package, create a parallel custom 3D clone, add cloud diagnostics, add persistence history,
or change the accepted device protocol/persistence architecture.

## Validation

```text
python3 docs/validate_home_dashboard_docs_2.2.0.py
requirements=88
acceptance=88
sad_covered_requirements=88
errors=0
```

Target-device and live-Hue checks remain implementation-phase acceptance work; they are not authority-gate prerequisites.
