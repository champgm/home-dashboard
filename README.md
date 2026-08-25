# Home Dashboard

Home Dashboard is a local-network Expo / React Native dashboard for Hue bridges and configured TP-Link devices. The active application is the root `App.tsx` entry point and the runtime under `src/app/**`.

## Prerequisites

- Node.js and npm installed, followed by `npm ci` at the repository root.
- Java available to the Android SDK tools.
- Android SDK with platform-tools, the emulator, and enough disk/RAM for an Android 36 Google APIs x86_64 phone image.
- Hardware virtualization enabled and usable by the emulator. Linux hosts normally need readable/writable `/dev/kvm`.

The supported development target is a native phone emulator because the app uses `react-native-tcp-socket`. Web, Expo Go, and a browser are not faithful targets for TP-Link behavior.

## One-time Android target setup

The setup script resolves the SDK from `ANDROID_SDK_ROOT`, then `ANDROID_HOME`, then executable discovery. It requires the official modern command-line tools at `cmdline-tools/latest`; it intentionally does not use the legacy `tools/bin` utilities that fail under current Java runtimes.

```sh
npm ci
npm run setup:android
```

Setup installs or verifies Android 36, Google APIs x86_64, platform-tools, and the emulator, then creates or reuses the dedicated Pixel-class AVD `Home_Dashboard_API_36`. It does not delete or modify `Wear_OS_Large_Round` or another existing AVD. If modern command-line tools are missing, install the current official Android SDK Command-line Tools into the SDK's `cmdline-tools/latest` directory and rerun the command.

## Daily native development session

Run the non-mutating check first when diagnosing a host:

```sh
npm run dev:android:check
```

Then start the native build, install, launch, and session capture:

```sh
npm run dev:android
```

The runner reuses a connected `Home_Dashboard_API_36` instance or starts it, waits up to 180 seconds for `sys.boot_completed=1`, and invokes the repository-local `expo run:android` command. It selects the emulator by its AVD name and sets `ANDROID_SERIAL`, so a different connected phone is not used accidentally. Press Ctrl+C to stop Expo and Logcat; the emulator remains running for the next session.

Each session writes identical records to both files:

- `logs/android-YYYYMMDD-HHMMSS.log` — timestamped archive;
- `logs/latest.log` — truncated and recreated for the latest session.

Every record has an ISO timestamp and `runner`, `expo`, or `device` source label. Structured application records retain the `HOME_DASHBOARD ` JSON prefix. Device output is scoped to the installed package UID rather than the whole system Logcat stream. Logs are ignored by Git, but inspect them before sharing: safe local endpoint/resource identifiers, build paths, and failure details may still be present. Never add credentials, payloads, signing values, or an unsanitized log to source control or evidence.

## Local-network behavior

The Android emulator uses its normal host network path. Configure only the private IPv4 address of the permanently bound Hue bridge and configured TP-Link endpoints through the app UI. `10.0.2.2` is the emulator's special address for a service on the development PC; it is not a substitute for a household device address. The app performs no cloud discovery or public-DNS fallback.

For a safe failure check, use an unreachable private test endpoint and inspect the captured session for the operation, safe resource location, result/category, elapsed time, and bounded cause. Do not perform destructive device actions just to create evidence.

## Useful checks and builds

```sh
npm run typecheck
npm run lint
npm run test:ci
npm run check:fixture-secrets
npm run doctor
npm run build:apk
npm run build
```

`npm run android` remains the direct Expo native command when session capture is not needed. `npm run start`, `npm run start:localhost`, and `npm run start:lan` remain available for Expo workflows, but they do not provide the native emulator build or project-local session archive.

## Common failures

- **Missing `sdkmanager` or `avdmanager`:** install the official current command-line tools under `cmdline-tools/latest`; do not revive `tools/bin`.
- **License, network, or disk failure:** rerun `npm run setup:android` after resolving the exact operation reported by the script.
- **ADB permission/daemon failure:** rerun `npm run dev:android:check`, inspect the ADB line, and resolve host permissions or a stale ADB process before launching the session.
- **Virtualization failure:** enable CPU virtualization and grant the emulator access to `/dev/kvm` on Linux.
- **Gradle/build failure:** verify Java, Android 36 platform/build tools, disk space, and that `npm ci` completed; rerun `npm run dev:android` after fixing the reported native error.
- **Host port 8081 is already in use:** no manual cleanup is required. The runner selects a free Metro port, embeds it in the debug build, and installs the matching `adb reverse` rule.
- **No device reachable on the LAN:** verify the emulator is online, the endpoint is a private IPv4 address, and the host firewall permits the local-network path. The app intentionally reports a bounded diagnostic instead of retrying through a different network.

## Release build

The existing EAS release command is available after the project's EAS credentials are configured:

```sh
npm run build
```
