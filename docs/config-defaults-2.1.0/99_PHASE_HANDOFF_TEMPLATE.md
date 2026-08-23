# Configuration Defaults Change — Phase Handoff / Evidence Template

Copy into `implementation_evidence/config-defaults-2.1.0/phase-XX.md`.

## Phase

- Phase: `XX — NAME`
- Status: `COMPLETE | BLOCKED — SRS REVISION REQUIRED | BLOCKED — SAD REVISION REQUIRED | BLOCKED — TARGET`
- Commit/revision:
- Date:

## Work completed

-

## Requirement IDs addressed

### Primary

-

### Supporting

-

## Acceptance criteria exercised

| Criterion | Result | Evidence |
|---|---|---|
| `AC-...` | PASS / PARTIAL / FAIL / PENDING TARGET | test/command/artifact |

## Tests and checks executed

```text
<exact command>
<actual result>
```

## Files materially changed

-

## Configuration-generation evidence

- Bundled-default generation(s) used:
- Persisted schema version(s) exercised:
- Migration fixture(s):
- Override/removal cases exercised:

## Diagnostics / privacy evidence

- Corruption/I/O failure exercised:
- User-visible diagnostic:
- Sensitive-data check:

## Known limitations

-

## Target-dependent checks not yet performed

- None / `PENDING TARGET: ...`

## Deviations or discovered specification problems

- None, or describe the issue and stop condition. Do not silently resolve it.

## Scope check

- [ ] No bridge switching/replacement behavior was introduced.
- [ ] No cloud configuration synchronization was introduced.
- [ ] Protected HueBinding semantics were not weakened.
- [ ] Explicitly removed bundled plugs cannot be resurrected by update.
- [ ] No arbitrary new defaultable fields were introduced outside SRS/SAD 2.1.0.

## Handoff notes for next phase

- What now exists:
- Interfaces/files the next phase should rely on:
- Pending target-gated work:
- Migration notes:
