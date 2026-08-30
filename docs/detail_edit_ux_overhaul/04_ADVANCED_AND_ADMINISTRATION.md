# Phase 04 — Advanced / Bridge / Administration — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Objective

Turn the Advanced area into a compact settings hierarchy using the same visual language as the migrated editors, without adding new administrative behavior.

Depends on Phases 01–03.

## Advanced index

Keep deliberate access to:

- Bridge configuration;
- Bridge capabilities/current bridge information;
- Hue provisioning;
- same-bridge reauthorization;
- Resource Links;
- Plug endpoint administration;
- current diagnostics.

Present these as grouped compact rows. Large capabilities/diagnostics should not be expanded in the ordinary index.

## Existing focused screens

Use the compact row/action treatment where it removes obvious verbosity, but do not redesign working flows simply for consistency.

Preserve:

- Bridge private-IPv4 validation/persistence/reset behavior;
- provisioning/reauthorization bridge/link-button/protected-store semantics;
- plug endpoint add/edit/remove behavior;
- local-only confirmed endpoint removal;
- current-only/bounded credential-safe diagnostics.

Do not add discovery, persisted diagnostic history, export, raw credential display, or a settings framework.

## Tests

Verify navigation reachability, capability/diagnostic secondary presentation, bridge address behavior, provisioning/reauthorization calls, plug administration semantics, destructive confirmation, and credential-sensitive values remaining absent from ordinary UI.

Run typecheck and affected admin/navigation tests, then the full repository suite.

## Exit

Advanced behaves like a compact settings index; every required existing function remains reachable; no network/storage/admin semantics changed.
