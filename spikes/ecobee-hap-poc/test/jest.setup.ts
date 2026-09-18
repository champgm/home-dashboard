jest.mock('expo-secure-store', () => ({
  __esModule: true,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock('react-native-quick-crypto', () => {
  const { Buffer } = require('buffer');
  return {
    __esModule: true,
    Buffer,
    default: {},
    install: jest.fn()
  };
});

jest.mock('react-native-tcp-socket', () => ({
  __esModule: true,
  default: { createConnection: jest.fn() }
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    refresh: jest.fn(),
    addEventListener: jest.fn(() => () => undefined)
  }
}));

jest.mock('@inthepocket/react-native-service-discovery', () => ({
  __esModule: true,
  addEventListener: jest.fn(),
  startSearch: jest.fn(),
  stopSearch: jest.fn()
}));
