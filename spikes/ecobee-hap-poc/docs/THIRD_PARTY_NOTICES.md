# Third-party notices and governance questions

This inventory is for the isolated POC. It is not a production distribution
approval.

| Component | Version / commit | License | Role | POC posture |
|---|---|---|---|---|
| hap-controller | 0.10.2 / `efe1d7a51f46f10c4180766db4ecf112c93e70ac` | MPL-2.0 | reviewed IP-HAP transcript reference | adapted, not runtime-imported |
| fast-srp-hap | 2.0.4 / `df6cdb6583024a3e4379501f4689777f02aa4d8c` | MIT | SRP client | narrow adapter |
| react-native-quick-crypto | 1.1.7 | MIT | React Native Node-crypto/Buffer bridge and Android primitive provider | bounded Android remediation; emulator rerun 7/0, initial Phase 04 gate retained FAIL |
| libsodium-wrappers | 0.7.15 / `4d18b3b5743422e6c4b5074b20da7ef014dc611a` | ISC | deterministic desktop reference for SHA-512, signatures, X25519, AEAD, randomness | test/reference provider; not used by the Android app path |
| @inthepocket/react-native-service-discovery | 0.2.12 / `575545813d61912d32b4e12d4f2d46f252aafcb7` | MIT | Android DNS-SD | selected native candidate; device qualification pending |
| @react-native-community/netinfo | 12.0.1 | MIT | active Wi-Fi transport/IP/subnet snapshot | selected native candidate; device qualification pending |
| react-native-tcp-socket | 6.4.2 / `f166efa6ff5611f38b7f17aa37c6b42944b63829` | MIT | local TCP stream | selected adapter |
| expo-secure-store | 57.0.1 | MIT | Android protected storage | selected adapter |

The exact package license files remain in the installed dependency tree and must
be included in any later distribution notice bundle. The root production app is
not a consumer of these dependencies.

## Separate HAP specification-use question

The POC uses publicly available protocol descriptions and an open-source reference
implementation for interoperability experimentation. That fact is not a legal
conclusion about commercial distribution. Before any production distribution,
the owner must obtain an explicit review of Apple authorization, certification,
program-membership, trademark, and specification-use requirements for the
intended product and jurisdictions. Status for this POC: `BLOCKED` for a future
distribution decision; not needed to run local deterministic tests.

## Vulnerability response owner

The POC owner must compare each pinned provider/reference version against upstream
security advisories before a release-like build. A vulnerable provider or an
unreviewed source update is a stop condition; there is no silent fallback.
