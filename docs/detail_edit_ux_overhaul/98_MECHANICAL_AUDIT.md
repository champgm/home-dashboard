# Lightweight Mechanical Audit — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

This audit exists to catch documentation/coverage mistakes, not to certify a household app.

## Documentation

- [ ] `00_UX_REQUIREMENTS.yaml` parses.
- [ ] supplemental requirement IDs are unique and valid.
- [ ] acceptance IDs are unique and valid.
- [ ] every acceptance criterion references existing requirements.
- [ ] every requirement has at least one acceptance criterion.
- [ ] every requirement appears in `00_REQUIREMENT_PHASE_MAP.md`.
- [ ] phase files `01` through `05` exist.
- [ ] `validate_detail_edit_ux_plan.py` passes.

## UX result

- [ ] migrated editors put common household edits before technical detail.
- [ ] large choice clouds are removed where they caused vertical sprawl.
- [ ] repeatable Scene/Rule/Schedule/dimmer structures are summarized by default.
- [ ] rare exact/raw values remain reachable without dominating normal screens.
- [ ] Save/Create is easy to reach on representative long screens.
- [ ] destructive actions remain separated and confirmed.
- [ ] primary controls are comfortably touchable on the target phone.

## Behavior preservation

- [ ] Unknown/read-only/capability tests pass.
- [ ] exact Group/resource ID/path preservation tests pass.
- [ ] changed-field and Schedule authorization behavior pass.
- [ ] Rule/Schedule action-policy tests pass.
- [ ] destructive confirmation tests pass.
- [ ] Configure Dimmer simple and structural tests pass.
- [ ] command failure/refresh tests pass.
- [ ] credential/fixture-secret checks pass.

## Non-regression

- [ ] dashboard navigation/tile tests pass.
- [ ] representative Pixel portrait pass completed or exact blocker recorded.
- [ ] no new UI framework/dependency was added without a concrete documented reason.
