# Phase Handoff / Implementation Evidence Template

Copy this structure into `implementation_evidence/phase-XX.md`. Replace every placeholder; do not leave important state only in chat.

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
| `AC-...` | PASS / FAIL / PENDING TARGET / NOT RUN | test name, command, screenshot/trace path |

## Tests and checks executed

```text
<exact command>
<result summary>
```

## Files materially changed

- `path/to/file`

## Diagnostics / observability evidence

- Failure mode exercised:
- User-visible diagnostic:
- Sensitive-data check:

## Known limitations

- 

## Target-dependent checks not yet performed

- None / `PENDING TARGET: ...`

## Deviations or discovered specification problems

- None, or describe the SRS/SAD issue and stop condition. Do **not** silently resolve it.

## Scope check

- [ ] No later-phase feature was pulled forward without a documented dependency reason.
- [ ] No DG-001..DG-006 decision was re-opened.
- [ ] No new requirement or architecture was invented.

## Handoff notes for next phase

- What now exists:
- Interfaces/files the next phase should rely on:
- Pending target-gated work carried forward:
- Any migration-only legacy files still present:
