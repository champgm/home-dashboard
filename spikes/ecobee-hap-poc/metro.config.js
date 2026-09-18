const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const quickCryptoModules = new Set(['crypto', 'node:crypto']);

// fast-srp-hap is intentionally retained as the SRP math implementation. Its
// Node crypto import must resolve to the React Native implementation in the
// Android bundle; the adapter imports the matching Buffer export directly,
// while the normal Metro resolver remains authoritative for every other module.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (quickCryptoModules.has(moduleName)) {
    return context.resolveRequest(context, 'react-native-quick-crypto', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
