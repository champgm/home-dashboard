# Supplemental Phased Implementation Plan — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Goal

Make detail/edit/admin screens compact and touch-friendly while preserving the already-working 2.4.1 behavior and leaving the swipe-page dashboard unchanged.

This is intentionally a **five-phase household-app plan**, not a generalized UI-platform program.

## Authority

1. `docs/SRS_2.4.1.yaml` — product/protocol behavior
2. `docs/SAD_2.4.1.yaml` — architecture constraints
3. `00_UX_REQUIREMENTS.yaml` — supplemental UX constraints
4. `00_UX_DESIGN.md` — selected interaction direction
5. current source/tests — implementation reality

If the conceptual design and the easiest correct implementation differ, prefer the simpler implementation as long as the requirements and SRS/SAD behavior remain satisfied.

## Execution rules

1. Execute Phases 01–05 in order, but do not manufacture abstractions before a real screen needs them.
2. Keep most changes in `src/ui/**` and `test/ui/**`.
3. Preserve existing service calls, payload semantics, capability guards, and destructive confirmation.
4. Do not add a UI/design-system package for convenience alone.
5. New primary pressables should normally be approximately 48dp and comfortable on the target phone.
6. Focused picker/subeditor behavior may use modal, navigation, or bounded inline expansion; choose the smallest reliable solution.
7. Temporary compatibility code is acceptable during migration. Remove only obvious dead paths; do not spend a phase pursuing component purity.
8. Record phase progress in one lightweight `implementation_evidence/detail_edit_ux_overhaul/status.md` file. A separate handoff note is optional when a phase exposes a non-obvious trap.
9. If an SRS/SAD behavior conflict appears, document it before changing behavior. Do not stop for harmless implementation differences from the UX concept sketches.

## Phase index

| Phase | Objective | Main coverage |
|---:|---|---|
| 01 | Prove the compact editor grammar on Light, Group, and Plug while building only the shared pieces they need | hierarchy, disclosure, large choices, touch controls, save/delete/live-state treatment |
| 02 | Apply summary/focused-edit patterns to Scene, Sensor, and Configure Dimmer | repeatable structures, dimmer UX, exact/technical disclosure |
| 03 | Migrate Rule, Schedule, and Resource Link without changing structured-management semantics | complex automation, unsupported/custom guards, exact path preservation |
| 04 | Compact Advanced/Bridge and administration screens | settings hierarchy, diagnostics/capabilities secondary |
| 05 | Simplify/clean up, run regressions, and perform one representative target-device acceptance pass | behavior preservation, dashboard non-regression, touch/keyboard usability |

## Test cadence

Before Phase 01:

```sh
npm run typecheck
npm run test:ci
npm run check:docs
npm run check:fixture-secrets
```

During Phases 01–04:

- run focused tests covering the screens/components changed;
- run typecheck;
- run the broader editor/dimmer/action-policy suites when that phase touches those behaviors;
- run the full repository suite after Phases 03 and 04, or sooner if a change crosses service/navigation boundaries.

Final Phase 05:

```sh
npm run typecheck
npm run test:ci
npm run check:docs
npm run check:fixture-secrets
python3 docs/detail_edit_ux_overhaul/validate_detail_edit_ux_plan.py
```

If working in Git, also run `git diff --check` before final closure.

## Regression priorities

Pay special attention to:

- Unknown-resource write suppression;
- capability/read-only boundaries;
- Group unavailable-member ID preservation;
- exact ID/path preservation behind friendly labels;
- changed-field behavior and unchanged Schedule command preservation;
- explicit Schedule authorization rebuild;
- Rule/Schedule action policy;
- destructive confirmation;
- Configure Dimmer simple repair and structural preview/failure semantics;
- command failure/refresh semantics;
- dashboard swipe/tile behavior.

These matter more than component-internal implementation purity.

## Final phone pass

Use the supported Pixel 9 Pro portrait target for a representative—not exhaustive—pass:

1. Light or Group: common edit, large selector, Save/Delete reachability.
2. Scene: multi-light summary and one light-state edit.
3. Configure Dimmer: action/target edit and Advanced technical detail.
4. Rule or Schedule: summary-driven complex editor and unsupported/read-only case if fixture exists.
5. Advanced: settings hierarchy and diagnostics/capabilities drill-in.
6. Keyboard/search: ordinary input does not make required actions unusable.
7. Dashboard: swipe, tile size, Favorite/Edit controls still look/behave as before.

A physical phone is preferred for the touch pass. Emulator/component tests remain useful for repeatable logic but are not treated as proof of tap comfort.

## Completion

The plan is complete when:

- all supplemental requirements have acceptance coverage and phase coverage;
- Phases 01–05 are marked complete in the single status log;
- focused and final regression checks pass, or an unrelated baseline blocker is explicitly recorded;
- the representative phone pass has no material usability regression;
- the dashboard was not intentionally redesigned;
- no SRS/SAD behavior change was silently introduced.
