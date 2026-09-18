# Adaptation provenance

The Pair Setup and Pair Verify message ordering, labels, HKDF labels, and TLV
field assignments were reviewed against `hap-controller` 0.10.2 from upstream
commit `efe1d7a51f46f10c4180766db4ecf112c93e70ac` (MPL-2.0).

Local changes are intentional and bounded:

- `Uint8Array` adapter ports replace direct Node socket/HTTP dependencies.
- `TlvDocument` rejects malformed/truncated/oversize input before allocation.
- crypto calls are routed through `CryptoProvider`; no primitive is hand-written.
- pairing failures preserve durable credentials and expose repair-required state.
- no BLE, accessory/server, cloud, or arbitrary endpoint modules are included.

Upstream tests are not represented as silently passing: the retained vector names
and local regression tests identify which transcript/codec behavior is covered.
Any future source update must follow `docs/UPSTREAM_UPDATE_PROCEDURE.md`.
