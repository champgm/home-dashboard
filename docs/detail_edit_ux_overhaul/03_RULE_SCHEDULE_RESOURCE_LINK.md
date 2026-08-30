# Phase 03 — Rule, Schedule, Resource Link — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Objective

Compact the densest structured editors without “simplifying” their data model or rewriting custom/unsupported automation.

Depends on Phases 01–02.

## Rule

- default: name, enabled state, concise Conditions list, concise Actions list;
- edit one known condition/action at a time;
- resolve friendly resource names only for presentation; keep exact paths/IDs internally;
- leave malformed/custom/unsupported existing shapes visible and read-only until the current explicit replacement behavior is used;
- move technical changed-field/raw-path aids to Advanced if retained.

## Schedule

- default: name, enabled state, concise `When`, concise `Action`, Autodelete;
- edit timing and command in focused structured views using current supported typed patterns;
- do not rewrite unavailable/unsupported commands to a nearby supported shape;
- preserve an unchanged existing command on ordinary Save;
- keep authorization rebuild a separate explicit recovery action.

## Resource Link

- default: class/name/description and concise linked-resource summary;
- use focused link selection where current structured behavior supports it;
- preserve exact Hue link paths and unsupported/read-only boundaries;
- keep destructive behavior confirmed and separate.

## Hard constraints

Do not:

- expose arbitrary raw method/address/body authoring;
- broaden action policy;
- rebuild Schedule credentials on normal Save;
- normalize custom Rule/Schedule content merely to make summaries easier;
- change status mutation timing;
- remove currently supported structured operations.

## Tests

Cover exact path/ID round-tripping, unsupported-form fail-closed behavior, Rule action bodies, Schedule typed patterns, unchanged-command preservation, explicit authorization rebuild, Resource Link exact paths, Unknown-resource handling, and existing action-policy/command-semantics suites.

Run the full repository test suite at the end of this phase because all major resource editor shapes have now moved.

## Exit

Rule/Schedule pages are summary-driven; full supported management remains reachable; custom/unsupported data is not silently altered; full tests pass or an explicit unrelated baseline issue is recorded.
