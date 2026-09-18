# HAP source and provider decision

Status: POC implementation decision; not production authorization.

## Selected protocol reference

The IP-HAP transcript shape is adapted from `hap-controller` 0.10.2, published from
`Apollon77/hap-controller-node` commit `efe1d7a51f46f10c4180766db4ecf112c93e70ac`.
The package is MPL-2.0. The POC retains the source provenance and test-provenance
record in `src/hap/core/PROVENANCE.md`; it does not import the package's BLE,
`dnssd`, Node TCP, or accessory/server modules.

The locally owned boundary is deliberately narrower:

| HAP concern | POC owner | Node/native dependency removed or isolated |
|---|---|---|
| Pair Setup / Pair Verify transcript | `src/hap/core/pairSetup/pairingProtocol.ts` | Node Buffer is replaced at the boundary by `Uint8Array`; UI and Node TCP are absent |
| TLV8 | `src/hap/core/wire/tlv8.ts` | bounded local codec with retained fragmentation tests |
| HAP HTTP | `src/hap/core/wire/http.ts` | incremental local parser; no `http-parser-js` deep import |
| encrypted records | `src/hap/core/wire/encryptedRecords.ts` | crypto adapter and bounded stream parser |
| SRP | `fast-srp-hap` 2.0.4 | narrow `SrpClientFactory` adapter |
| signatures, X25519, AEAD, SHA-512 | `react-native-quick-crypto` 1.1.7 on Android; `libsodium-wrappers` 0.7.15 as desktop reference | narrow `CryptoProvider` adapter |
| DNS-SD | `@inthepocket/react-native-service-discovery` 0.2.12 | Android NSD/Bonjour adapter; no Node `dnssd` |
| TCP | `react-native-tcp-socket` 6.4.2 | `TcpAdapter` / `ByteStream` adapter |
| protected storage | `expo-secure-store` 57.0.1 | `SecureValueStore` adapter |

## Provider decision

- Historical first implementation: `libsodium-wrappers` plus `fast-srp-hap`.
  Deterministic vectors pass, but the Android Hermes runtime gate failed at the
  Node-crypto boundary used by the SRP path.
- Bounded remediation: `react-native-quick-crypto` 1.1.7 as the React Native
  Node-crypto bridge and primitive provider, retaining the narrow
  `fast-srp-hap` SRP adapter. It uses explicit Metro `crypto`/`node:crypto`
  mapping, startup installation, and Android raw-private Ed25519 compatibility.
  The rebuilt emulator app reports `7 passed · 0 failed`; the initial Phase 04
  gate remains recorded `FAIL` until an explicit qualification review.
- Rejected: the complete `hap-controller` package as a runtime dependency. Its
  Node DNS-SD, BLE, and Node stream assumptions exceed this POC boundary.

## Important qualification boundary

Package license compatibility does not establish permission to distribute a HAP
controller. HAP specification-use, Apple authorization/certification, and any
post-POC distribution restrictions are tracked separately in
`THIRD_PARTY_NOTICES.md`. The unresolved distribution question is a governance
decision, not an engineering inference.

## Maintenance decision

Security and protocol updates are compared against the pinned upstream commit and
the local provenance file before a dependency or copied module is changed. A
vulnerability in an adopted source or provider blocks a release-like POC build
until the owner records an updated commit/version, regression results, and a
decision about the local adaptation surface.
