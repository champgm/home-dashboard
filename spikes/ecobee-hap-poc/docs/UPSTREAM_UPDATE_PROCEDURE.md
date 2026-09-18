# Upstream update procedure

1. Record the proposed package version and immutable upstream commit.
2. Read the upstream changelog, source diff, license, and security advisories.
3. Re-run the source mapping against the local HAP ports. Explicitly exclude BLE,
   server, cloud, Node DNS-SD, and arbitrary endpoint behavior.
4. Re-run retained TLV, HTTP, encrypted-record, SRP, Pair Setup, and Pair Verify
   vectors on Jest and the Hermes Android development build.
5. Review every changed cryptographic call and transcript label.
6. Update `HAP_SOURCE_DECISION.md`, `THIRD_PARTY_NOTICES.md`, and the phase evidence
   with the new provenance and local modifications.
7. A failed vector or unresolved governance/security question blocks adoption; it
   does not trigger an automatic downgrade or protocol fallback.
