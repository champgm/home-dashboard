# Ecobee HAP POC — Phase 08 Evidence

## Status

`PARTIAL`: deterministic Pair Verify and session ownership pass; the required twenty-cycle Android target run is `PENDING TARGET`.

## Scope and traceability

- Primary: `OBJ-05`, `ARC-09`.
- Supporting: `ARC-06`, `ARC-07`, `ARC-08`.
- Acceptance: `HAP-004` is locally verified with fakes and `PENDING TARGET` for cold start; `HAP-005` is `PENDING TARGET` for the twenty-cycle run.

## Evidence

- `src/hap/core/pairVerify/pairVerifyService.ts` loads the committed record, performs Pair Verify, injects session keys into the transport, and preserves durable credentials on transient session failure.
- `src/hap/session/sessionCoordinator.ts` enforces one active connection operation, generation ownership, stale-close rejection, and bounded retry accounting.
- Pair Verify failures are surfaced as explicit failures and invoke repair handling without initiating Pair Setup.
- The full deterministic transcript test covers encrypted request/response framing after verification.

## Verification

```text
test/pairVerify/service.test.ts     -> PASS
test/pairVerify/transcript.test.ts -> PASS
test/recovery/generation.test.ts   -> PASS
test/transport/session.test.ts     -> PASS
npm --prefix spikes/ecobee-hap-poc run typecheck -> PASS
```

Cold-start validation and twenty repeated target cycles cannot be inferred from simulation.
