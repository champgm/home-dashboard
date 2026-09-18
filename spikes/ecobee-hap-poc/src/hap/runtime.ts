import { Buffer, install as installQuickCrypto } from 'react-native-quick-crypto';

let runtimeInstalled = false;

/**
 * Install the native Node-crypto compatibility boundary before any HAP work.
 *
 * `fast-srp-hap` remains the SRP implementation, but its `crypto` import and
 * global Buffer assumptions are only valid in React Native after Metro maps
 * them to react-native-quick-crypto and this installer has run. A missing or
 * unusable native provider is deliberately allowed to throw at app startup;
 * silently falling back would invalidate the Android qualification gate.
 */
export function installRuntimePolyfills(): void {
  if (runtimeInstalled) return;

  installQuickCrypto();
  if (typeof globalThis.Buffer === 'undefined') {
    (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
  }
  runtimeInstalled = true;
}

// fast-srp-hap evaluates its group parameters while the module graph loads,
// so the native Buffer must exist before AppShell imports the SRP adapter.
installRuntimePolyfills();
