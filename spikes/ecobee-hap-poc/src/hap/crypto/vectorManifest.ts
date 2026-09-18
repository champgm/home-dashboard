export interface CryptoVectorManifest {
  readonly provider: string;
  readonly sources: readonly string[];
  readonly vectors: readonly {
    readonly name: string;
    readonly purpose: string;
  }[];
}

export const cryptoVectorManifest: CryptoVectorManifest = {
  provider: 'react-native-quick-crypto@1.1.7 + fast-srp-hap@2.0.4 on React Native (libsodium-wrappers@0.7.15 desktop reference)',
  sources: [
    'HAP Pair Setup/Verify transcript definitions retained from hap-controller-node@0.10.2',
    'RFC 5869 SHA-512 HKDF known-answer vectors',
    'RFC 4231 HMAC-SHA-512 known-answer vectors'
  ],
  vectors: [
    { name: 'sha512-empty', purpose: 'SHA-512 digest encoding' },
    { name: 'hmac-sha512-rfc4231', purpose: 'HMAC-SHA-512 exact bytes' },
    { name: 'hkdf-sha512-rfc5869', purpose: 'HAP key derivation composition' },
    { name: 'x25519-roundtrip', purpose: 'Pair Verify key agreement' },
    { name: 'ed25519-roundtrip', purpose: 'Pair Setup/Verify signatures' },
    { name: 'chacha20-poly1305-roundtrip', purpose: 'HAP encrypted records' },
    { name: 'srp-hap-transcript', purpose: 'Pair Setup SRP transcript' }
  ]
};
