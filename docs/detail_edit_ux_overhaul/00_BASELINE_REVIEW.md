# Supplemental Baseline Review — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Decision

Proceed as a supplemental UI iteration. No SRS 2.4.1 or SAD 2.4.1 revision is required before implementation.

The application is already functionally successful for its intended household use. This iteration should be biased toward small, reversible UI changes and existing behavior preservation.

## Compatibility

The revised UX requirements do not change:

- swipe-page dashboard navigation (`FR-005`);
- Advanced/Bridge capability location (`FR-006`);
- required Hue management reachability (`FR-013`);
- Unknown/read-only/capability guards (`FR-011`, `FR-012`);
- changed-field and Schedule authorization behavior (`HUE-020`);
- Configure Dimmer simple/structural behavior (`HUE-021`, `HUE-022`);
- destructive confirmation (`UX-DEL-001..003`);
- credential handling (`SEC-002`);
- command failure/refresh semantics (`REL-*`);
- dashboard tile behavior (`UX-VIS-001..002`).

The work remains inside the existing UI responsibility boundary and uses current React Native/navigation primitives unless a concrete blocker justifies otherwise.

## Adversarial simplifications accepted

The following are intentionally **not** baseline requirements:

- a universal new editor design system;
- mandatory modal architecture;
- mandatory persistent bottom Save bar;
- exact counts of requirements/criteria;
- exactly one phase owner for every requirement;
- per-phase evidence files;
- full physical-device inspection of every editor permutation;
- full repository tests after every small UI-only step.

These controls would cost more than the risk they mitigate for this project.

## Verification baseline

The planning archive did not include `node_modules`, so TypeScript/Jest were not freshly rerun when the original UX package was prepared. The existing 2.4.1 documentation validators and fixture-secret checks were reported passing, and the latest persisted implementation evidence reported the code suite/typecheck passing.

Before modifying code, establish one fresh normal development baseline in an environment with dependencies. Do not treat historical counts as a contractual test count.

## When a baseline revision is actually needed

Revise/stop for design review only if the UI work would require a real behavior/architecture change, such as:

- dropping a currently required management operation;
- changing immediate-vs-staged mutation timing;
- weakening destructive confirmation;
- silently normalizing custom/unsupported automation;
- changing dimmer structural behavior;
- adding durable workflow/transaction state;
- adding a substantial new UI framework/dependency.

Cosmetic implementation differences from conceptual component names do not require a baseline revision.
