# Phase 05 — Final Polish and Acceptance — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Objective

Remove obvious migration leftovers, run final regression gates, and verify the result on the actual target interaction surface without turning the pass into formal certification.

Depends on Phases 01–04.

## Cleanup

- remove clearly dead old-only editor styles/components;
- keep harmless compatibility exports if removing them creates churn without user benefit;
- search for remaining large option clouds in migrated editors;
- search for permanently duplicated exact-value inputs that make default views tall;
- search for raw `JSON.stringify` technical objects in ordinary editor flows;
- confirm dashboard components/navigation were not intentionally refactored.

Do not delay completion solely to achieve an abstract “one canonical component” purity goal.

## Final local gates

```sh
npm run typecheck
npm run test:ci
npm run check:docs
npm run check:fixture-secrets
python3 docs/detail_edit_ux_overhaul/validate_detail_edit_ux_plan.py
```

If in Git, run `git diff --check`.

## Representative Pixel 9 Pro portrait pass

Check:

1. Light or Group common editing and Save/Delete reachability.
2. Group large selection with enough items to exercise scrolling.
3. Scene multi-light summary and one focused light-state edit.
4. Configure Dimmer target edit plus Advanced exact references.
5. Rule or Schedule summary-driven editing and one unsupported/read-only case if readily available.
6. Advanced settings hierarchy and diagnostics/capabilities drill-in.
7. Keyboard/search does not make required controls unusable.
8. Dashboard swipe, tile geometry, Favorite/Edit controls look and behave as before.

Touch targets should feel unambiguous; do not spend time measuring every pressable if the representative target pass and component geometry are clear.

## Acceptance record

Update `implementation_evidence/detail_edit_ux_overhaul/status.md` with:

- phase completion table;
- six supplemental acceptance-criterion outcomes;
- commands/tests executed;
- target-pass outcome;
- any intentionally retained compatibility/deviation;
- any known low-impact UX limitation intentionally deferred.

## Exit

Declare complete when the final local gates pass, the representative phone pass finds no material UX problem, and no working SRS/SAD behavior was silently changed.
