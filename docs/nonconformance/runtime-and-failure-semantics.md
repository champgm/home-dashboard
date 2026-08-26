# Runtime and Failure-Semantics Nonconformance

Current disposition: `NC-REL-001` is closed locally by [rectification phase 09](../../implementation_evidence/nonconformance_rectification_plan/phase-09.md); controlled network interruption and target UI evidence remain pending.

## `NC-REL-001` — Ambiguous Hue writes do not attempt read-back

Severity: **High**  
Requirement: `REL-003`  
Status: **CLOSED — LOCAL IMPLEMENTATION; TARGET ACCEPTANCE PENDING**

`ApplicationService.executePlugMutation` performs a read-back after an ambiguous plug write. `executeHueMutation` does not: any non-success result, including `ambiguous`, is returned immediately without a Hue refresh/read-back attempt. This contradicts the requirement to attempt one observable-state read-back while foregrounded when a write outcome is ambiguous.

Required closure:

- distinguish Hue operations whose resulting state/resource existence is observable;
- after an ambiguous write, perform one authoritative foreground read-back/refresh without repeating the write;
- reconcile a matching observation as allowed by the requirement and leave nonmatching/unavailable observation ambiguous;
- preserve generation/lifecycle guards;
- add matching, nonmatching, concurrent-controller, and background-abandonment tests.

## Other runtime disposition

The source audit found local implementations for foreground scheduling, generation invalidation, bounded deadlines, TP-Link ambiguous read-back, Hue response classification, bounded diagnostic keys, and unknown-state suppression. Target/additional acceptance remains unresolved where listed in the evidence report.
