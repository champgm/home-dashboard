# Phase Handoff Template — `local_running_and_logs`

Copy this structure into `implementation_evidence/supplemental-phase-XX.md`. Every handoff must retain the exact plan name `local_running_and_logs`.

## Plan

`local_running_and_logs`

## Phase

- Phase: `XX — NAME`
- Status: `COMPLETE | BLOCKED — SRS REVISION REQUIRED | BLOCKED — SAD REVISION REQUIRED | BLOCKED — TARGET`
- Commit/revision:
- Date:

## Work completed

-

## Findings addressed

### Primary

- `SUP-...`

### Supporting verification

- `SUP-...` / None

## Relevant authority exercised

- SRS requirements:
- SRS acceptance criteria:
- SAD sections/ADRs:

## Tests and checks executed

```text
<exact command>
<PASS/FAIL result and counts>
```

## Files materially changed

- `path/to/file`

## Logging and diagnostic evidence

- Operation/failure mode exercised:
- Location/context retained:
- Useful underlying cause retained:
- Bounds/redaction result:
- Production no-emission result:
- Captured session path, if applicable:

Do not paste real credentials, credential-bearing paths, raw payloads, household device state, or unsanitized session logs into evidence.

## Target-dependent checks

- Completed:
- `PENDING TARGET`: None / exact check, prerequisite, and owning later phase

## Discovered specification or architecture issues

- SRS issues: None / exact issue and required decision
- SAD issues: None / exact issue and required decision

Do not silently resolve a new requirement or architecture conflict in implementation.

## Unchanged-behavior audit

- [ ] No production telemetry, remote logging, or persistent in-app diagnostic history added.
- [ ] No credential, credential-bearing path, payload, signing material, or household data logged.
- [ ] No device protocol, retry, timeout, read-back, lifecycle, or state-publication semantics changed.
- [ ] No single-bridge, local-only networking, persistence, or UI requirement changed.
- [ ] No existing SDK/AVD or unrelated working-tree change was deleted/overwritten.
- [ ] No later-phase work was pulled forward without documented justification.

## Remaining work and handoff notes

- What now exists:
- Files/interfaces/commands the next phase should rely on:
- Remaining findings/checks:
- Exact next command:

## Exit-criteria confirmation

- [ ] Scoped remediation is implemented.
- [ ] Focused and regression tests pass.
- [ ] Evidence is persisted and identifies `local_running_and_logs`.
- [ ] No unresolved issue is silently deferred.
- [ ] Phase ends at a clean commit/review boundary.
