# Ecobee HAP POC

This is an isolated Android-first Expo 57 / React Native 0.86 experiment. It is
not imported by the production Home Dashboard app.

Run deterministic checks from the repository root:

```sh
npm install --prefix spikes/ecobee-hap-poc
npm --prefix spikes/ecobee-hap-poc run typecheck
npm --prefix spikes/ecobee-hap-poc run test:ci
npm --prefix spikes/ecobee-hap-poc run audit:secrets
```

Build a versioned standalone APK and copy it to the established Insync Google
Drive APK folder:

```sh
npm --prefix spikes/ecobee-hap-poc run build:apk
```

The command increments the patch version and Android version code, recreates
the generated Android project, builds the release APK with the required Gradle
heap, and writes `dist/ecobee-hap-poc-v<VERSION>.apk` before copying the same
file to `~/Insync/gilbertmccoy@gmail.com/Google Drive/APKs/`.

Physical target procedures and the final decision live in
`implementation_evidence/ecobee-hap-poc/`.

The app shell includes the crypto qualification-vector runner and a sanitized
target-run sheet. The sheet records only allowlisted result categories in
protected storage and can share that same category-only summary; it does not accept logs or target identifiers. Discovery
refreshes Android NetInfo before browsing and refuses to start unless active
Wi-Fi IPv4/subnet data is available, so the local endpoint policy can reject
addresses outside the active CIDR.
