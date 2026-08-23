# Phase 25 — Plug UI, Endpoint Administration, and Editor Contract Audit

Before implementation, read:

- `implementation_plan/00_IMPLEMENTATION_PLAN.md`
- `implementation_plan/00_REQUIREMENT_PHASE_MAP.md`
- `SRS_2.0.0.yaml`
- `SAD_2.0.0.yaml`
- `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`

**Prerequisite phases:** Phase 02, Phase 14, Phase 17, Phase 18, Phase 19, Phase 20, Phase 21, Phase 22

## Objective

Complete the Plugs tab and endpoint administration, physical alias editing and energy display, then perform a cross-resource editor-contract audit so only supported writable fields are editable everywhere.

## Why this phase exists

Plug UI depends on both protocol and config persistence. The editor audit belongs here because by this point every Hue and plug editor exists, so FR-013 can be completed without a broad late implementation phase.

## Authoritative requirements

- `FR-013` (**PRIMARY OWNER**) — Editors shall expose the fields and operations required for the Hue V1 and TP-Link management requirements while preventing unsupported/read-only fields from being presented as writable.
- `TPL-002` (**PRIMARY OWNER**) — Each plug endpoint shall be configurable in the GUI by IPv4 address and TCP port, with 9999 used as the default port when not otherwise specified.
- `TPL-007` (**PRIMARY OWNER**) — The sole user-visible plug name shall be the alias stored on the physical plug; renaming in Home Dashboard shall update that device alias. Before a plug has ever returned an alias, the UI may show its configured IPv4 endpoint only as a technical locator, not as an application-local plug name.
- `TPL-009` (**PRIMARY OWNER**) — The application shall support bundled pre-seeded plug endpoint information and shall allow each phone to modify its local endpoint list after first use without application upgrades silently overwriting those edits.
- `TPL-010` (**PRIMARY OWNER**) — Removing a plug endpoint shall remove only the local endpoint record and shall not factory-reset, reboot, unpair, or otherwise reconfigure the physical plug.
- `TPL-005` (supporting) — The application shall display locally returned plug information including physical alias, model, hardware/software identifiers, MAC, signal information, relay state, and feature indicators when present.
- `TPL-006` (supporting) — The application shall read and set plug relay power state.
- `TPL-008` (supporting) — The application shall expose energy/consumption information only when the plug reports that capability and shall not treat absence of energy monitoring as an error.
- `QA-001` (supporting) — Primary navigation, Favorites, common toggles, Scene activation, editors, confirmation dialogs, and Advanced/Bridge shall be operable on both supported Pixel 9 Pro phones in portrait orientation without layout clipping that hides required controls.

## Relevant SAD sections

- `SAD_2.0.0.yaml:supported_resource_semantics.plug`
- `SAD_2.0.0.yaml:preseed_architecture`
- `SAD_2.0.0.yaml:persistence_architecture`
- `SAD_2.0.0.yaml:repository_structure.root`

## In scope

- Plugs tab with Known/Unknown/Pending tile behavior and physical device alias as the sole user-visible plug name after first sysinfo.
- Before first successful alias read, display IPv4 endpoint only as a technical locator.
- Plug detail/editor for sysinfo, relay, alias, optional energy fields.
- Advanced plug endpoint add/edit/remove UI with default port 9999 and Phase 02 validation.
- Removing endpoint changes only local config and uses shared confirmation; no reboot/reset/unpair command.
- Verify preseed appears only on absent/reset config and subsequent app update does not merge/overwrite user edits.
- Audit every resource editor against HueV1ResourceCatalog/TpLink models so read-only/unsupported fields are not writable.

## Explicitly out of scope

- TP-Link discovery
- Local plug display aliases
- New Hue features

## Expected repository changes

### Existing prerequisite files/directories

- src/protocol/tplink/
- src/storage/ConfigStore.ts
- src/ui/navigation/
- src/ui/editors/
- `implementation_evidence/phase-02.md` (output of Phase 02)
- `implementation_evidence/phase-14.md` (output of Phase 14)
- `implementation_evidence/phase-17.md` (output of Phase 17)
- `implementation_evidence/phase-18.md` (output of Phase 18)
- `implementation_evidence/phase-19.md` (output of Phase 19)
- `implementation_evidence/phase-20.md` (output of Phase 20)
- `implementation_evidence/phase-21.md` (output of Phase 21)
- `implementation_evidence/phase-22.md` (output of Phase 22)

### Expected outputs created or materially modified by this phase

- src/ui/screens/PlugsScreen.tsx
- src/ui/screens/PlugAdministrationScreen.tsx
- src/ui/editors/PlugEditor.tsx
- test/ui/plugs/
- test/ui/editorContract/
- implementation_evidence/phase-25.md

Paths listed as outputs do not need to exist before this phase begins. Any prerequisite from an earlier phase must exist before implementation starts.

## Required implementation behavior

- No discovery or hostname entry.
- Alias rename writes physical plug alias.
- Energy absence is a normal capability state.
- Endpoint removal never sends a TP-Link device command.

## Tests

- Endpoint add/edit validation/default port.
- Physical alias display and rename wiring.
- Energy supported/unsupported display.
- Local remove -> config/Favorite cleanup and zero plug network command.
- Preseed/update preservation tests.
- Cross-resource editor contract test against catalog writable/read-only descriptors.
- Portrait layout smoke.

### Target-gated verification

- None in this phase.

Target-gated work permitted to move forward must be recorded as `PENDING TARGET` in `implementation_evidence/phase-25.md`. Do not pretend it passed.

## Acceptance focus

- `AC-FR-013` — Using the documented Hue V1 resource catalog plus live fixtures, verify each supported field is editable/read-only as specified and unsupported fields cannot be submitted as writes.
- `AC-TPL-002` — Add/edit a plug with a private IPv4 address and omitted port, verify port 9999 is stored; edit to another valid port and verify it persists.
- `AC-TPL-005` — Feed characterized HS100/HS103/HS110 sysinfo and verify returned fields are represented without inventing unavailable fields.
- `AC-TPL-006` — For representative deployed HS100/HS103/HS110 devices, command On and Off and verify read-back matches each state.
- `AC-TPL-007` — Rename each representative plug, verify sysinfo returns the new physical alias, restore it, and verify a never-contacted endpoint is labeled only by its technical address.
- `AC-TPL-008` — Verify HS110 energy data is shown and HS100/HS103 unsupported-emeter responses produce no error state or invented telemetry.
- `AC-TPL-009` — Install with preseed data, edit/remove/add endpoints, simulate an app update containing the same/new defaults, and verify existing local edits remain authoritative.
- `AC-TPL-010` — Remove a configured plug and inspect protocol trace to verify no command is sent to the device; re-add the endpoint and verify the unchanged plug remains controllable.
- `AC-QA-001` — Run visual/end-to-end layout tests on both phones at supported font/display settings and verify all required controls remain reachable.

## Acceptance completion note

Criteria listed above should be marked PASS only for the portions actually exercised in this phase; record PARTIAL/PENDING TARGET explicitly when later work is required.

## Commands / checks

Run from the repository root. If a command depends on an output produced in this phase (for example the release APK), create that output first as described above.

```sh
npm run typecheck
npm run lint
npm run test:ci -- test/ui/plugs test/ui/editorContract
git diff --check
```

If a listed tool is unavailable only for a permitted target-gated check, record the missing tool/target and exact pending command in evidence; do not replace it with an unrelated check.

## Persisted implementation evidence

Create or update **output** `implementation_evidence/phase-25.md` using `implementation_plan/99_PHASE_HANDOFF_TEMPLATE.md`.

At minimum record:

- work completed;
- primary/supporting requirement IDs;
- tests/checks and actual results;
- acceptance criteria exercised;
- materially changed files;
- known limitations;
- target-dependent checks not yet performed;
- deviations or discovered SRS/SAD problems;
- handoff notes.

## Exit criteria

- [ ] Every in-scope implementation item exists and follows the listed SAD sections.
- [ ] All non-target-gated tests/checks required by this phase pass.
- [ ] Every target-gated item is either passed with evidence or explicitly recorded `PENDING TARGET` where this phase permits deferral.
- [ ] `implementation_evidence/phase-25.md` is complete and committed with the implementation.
- [ ] No SRS ambiguity or SAD contradiction discovered in this phase remains silently unresolved.
- [ ] No later-phase work was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 accepted simplification was re-opened.
