# Foreground observation policy

Status: candidate policy pending physical target measurement.

The preferred policy is event subscription for projected characteristics whose HAP
metadata includes `ev`. The subscription acknowledgement is not treated as a
value event. Event callbacks carry the session generation and stale generations
are discarded.

If the target rejects or fails to deliver relevant events, the fallback is one
serialized foreground poll every 30 seconds, with a maximum backoff of five
minutes after a failed read. The scheduler stops on backgrounding/session close,
never overlaps reads, and has no Android background service.

The final choice requires target measurements of delivery latency, missed events,
poll traffic, stale windows, and reconnect behavior. Current status: `PENDING
TARGET`; no production SLA is inferred from the local scheduler tests.
