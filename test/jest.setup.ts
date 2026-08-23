jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("expo-secure-store", () => ({
  __esModule: true,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
