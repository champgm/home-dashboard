# Adversarial Review — `detail_edit_ux_overhaul`

## Plan

`detail_edit_ux_overhaul`

## Review lens

This is a low-stakes, local household application used by two adults to control one home. The app already works well. The UX iteration should therefore optimize for **useful improvement with low implementation risk**, not process completeness or generalized product-platform architecture.

## Findings

### 1. The original eight-phase plan was too granular

Separating editor primitives, shell, pickers, simple editors, complex editors, administration, and final acceptance into eight mandatory review boundaries creates coordination overhead without a corresponding reduction in household risk.

**Revision:** five phases. Shared components are created in the same phase that proves them on real editors.

### 2. The original design over-specified implementation mechanisms

Names such as `SelectionModal`, `SubeditorModal`, and `ExactValueModal`, and a required `Modal + FlatList` implementation, prematurely selected internal structure. Nested modal behavior could become more complicated than the problem being solved.

**Revision:** specify interaction contracts, not mandatory component topology. A focused picker/editor may be a modal, navigation screen, or bounded inline disclosure. Prefer the smallest implementation that is reliable on the supported phone.

### 3. “One canonical design system” was stronger than necessary

Consistency matters, but forcing every editor through a new abstract component hierarchy can cause a broad refactor before the useful UX changes land.

**Revision:** require shared patterns where reuse is obvious, but permit small resource-specific composition. Avoid duplicate large-choice, disclosure, and action semantics; do not require theoretical component purity.

### 4. Persistent Save was specified as a mandatory footer architecture

A fixed footer may help long screens, but it also consumes viewport space and adds keyboard/safe-area complexity. Once the screens are compact, a header action or naturally reachable Save may be adequate.

**Revision:** require Save/Create to be easy to reach on long editors. A sticky footer, header action, or sufficiently short page all satisfy the requirement. Do not build persistent chrome unless it improves the real screens.

### 5. Exact numeric entry was treated as if every protocol value deserved a dedicated secondary workflow

Full Hue management must remain available, but that does not imply a universal exact-value modal abstraction.

**Revision:** hide rare exact values from the normal flow and retain them through the simplest sensible Advanced/disclosure treatment.

### 6. Traceability mechanics were too rigid

“Exactly 15 requirements”, “exactly 10 acceptance criteria”, exactly one primary owner, per-phase evidence documents, and hard-coded validator counts are process artifacts rather than safeguards for this project.

**Revision:** requirements/criteria only need unique IDs, complete acceptance coverage, and a clear phase coverage map. One lightweight implementation status log is sufficient unless a phase needs a deeper handoff note.

### 7. Full-suite testing after every small phase was disproportionate

The important risk is accidentally changing working resource behavior while rearranging UI.

**Revision:** run focused UI tests during each phase and the full repository gates after behaviorally broad phases and at final acceptance. Existing protocol/service tests remain the regression authority.

### 8. Physical-device acceptance was too exhaustive

A phone pass is valuable because the goal is touch usability, but exhaustively re-verifying every editor/control combination on physical hardware is unnecessary for two known users and one known device class.

**Revision:** perform a representative Pixel 9 Pro portrait pass: one simple editor, one large selector, one complex automation editor, Configure Dimmer, Advanced/settings, keyboard behavior, and the dashboard.

## Risks worth keeping strict

The relaxed process does **not** relax these implementation constraints:

- do not change Hue/TP-Link mutation semantics as a side effect of layout work;
- do not silently rewrite unsupported/custom Rule, Schedule, Scene, or dimmer data;
- preserve unavailable selected resource IDs until explicitly removed;
- preserve destructive confirmation;
- preserve Unknown/read-only/capability guards;
- keep credentials and credential-bearing values out of ordinary UI/diagnostics;
- keep the dashboard swipe/tile surface out of scope.

These are inexpensive safeguards around behavior that is already known to work.

## Decision

Proceed with the revised five-phase supplemental plan. Optimize implementation for **compactness, obvious touch interaction, and behavior preservation**, not generalized UX infrastructure.
