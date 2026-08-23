import { AppConfig } from "../../src/app/types";
import { BundledDefaults } from "../../src/config/bundledDefaults";
import { resolveConfig } from "../../src/config/overlayResolver";
import {
  migrateConfigToOverlay,
  parsePersistedConfiguration,
  parseUserConfigOverlayJson,
  serializeConfig,
  serializeUserConfigOverlay,
} from "../../src/storage/configSchema";

const defaultsA: BundledDefaults = {
  bridge: { ipv4: "192.168.1.2" },
  plugs: [
    { id: "p1", ipv4: "192.168.1.10", port: 9999 },
    { id: "p2", ipv4: "192.168.1.11", port: 9999 },
    { id: "p3", ipv4: "192.168.1.12", port: 9999 },
  ],
};

describe("configuration overlay schema and migration", () => {
  test("migrates same, changed, missing, and user-added plugs by stable ID", () => {
    const legacy: AppConfig = {
      bridge: { ipv4: "192.168.1.99" },
      plugs: [
        { id: "p1", ipv4: "192.168.1.10", port: 9999 },
        { id: "p2", ipv4: "192.168.1.88", port: 9999 },
        { id: "user", ipv4: "192.168.1.50", port: 9999 },
      ],
      favorites: [{ kind: "plug", plugEndpointId: "p2" }],
      settings: { theme: "dark", diagnosticsVisible: true },
    };
    const overlay = migrateConfigToOverlay(legacy, defaultsA);
    expect(overlay.bridgeOverride).toEqual({ ipv4: "192.168.1.99" });
    expect(overlay.plugOverrides).toEqual([{ id: "p2", ipv4: "192.168.1.88", port: 9999 }]);
    expect(overlay.removedPlugIds).toEqual(["p3"]);
    expect(overlay.addedPlugs).toEqual([{ id: "user", ipv4: "192.168.1.50", port: 9999 }]);
    expect(overlay.favorites).toEqual(legacy.favorites);
    expect(overlay.settings).toEqual(legacy.settings);
    expect(resolveConfig(defaultsA, overlay)).toEqual(legacy);
  });

  test("same bridge/default values are canonicalized away", () => {
    const legacy: AppConfig = {
      bridge: { ipv4: "192.168.1.2" },
      plugs: [...defaultsA.plugs],
      favorites: [],
      settings: {},
    };
    expect(migrateConfigToOverlay(legacy, defaultsA)).toEqual({
      plugOverrides: [],
      removedPlugIds: [],
      addedPlugs: [],
      favorites: [],
      settings: {},
    });
  });

  test("malformed and future schemas fail closed", () => {
    expect(() => parsePersistedConfiguration("not-json", defaultsA)).toThrow();
    expect(() => parsePersistedConfiguration(JSON.stringify({ schemaVersion: 99 }), defaultsA)).toThrow();
    expect(() => parseUserConfigOverlayJson(JSON.stringify({ schemaVersion: 2, plugOverrides: "bad" }), defaultsA)).toThrow();
  });

  test("v1 and v2 serialization round-trip through the persisted parser", () => {
    const legacy: AppConfig = { bridge: {}, plugs: [], favorites: [{ kind: "light", id: "1" }], settings: {} };
    expect(parsePersistedConfiguration(serializeConfig(legacy), defaultsA)).toEqual({ kind: "legacy", config: legacy });
    const overlay = migrateConfigToOverlay(legacy, defaultsA);
    const serialized = serializeUserConfigOverlay(overlay);
    expect(parsePersistedConfiguration(serialized, defaultsA)).toEqual({ kind: "overlay", overlay });
  });
});
