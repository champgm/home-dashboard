import { BundledDefaults } from "../../src/config/bundledDefaults";
import {
  createEmptyUserConfigOverlay,
  overlayFromConfig,
  resolveConfig,
  UserConfigOverlay,
  validateUserConfigOverlay,
} from "../../src/config/overlayResolver";

const defaultsA: BundledDefaults = {
  bridge: { ipv4: "192.168.1.2" },
  plugs: [
    { id: "p1", ipv4: "192.168.1.10", port: 9999 },
    { id: "p2", ipv4: "192.168.1.11", port: 9999 },
    { id: "p3", ipv4: "192.168.1.12", port: 9999 },
  ],
};

const defaultsB: BundledDefaults = {
  bridge: { ipv4: "192.168.1.3" },
  plugs: [
    { id: "p1", ipv4: "192.168.1.20", port: 9999 },
    { id: "p2", ipv4: "192.168.1.21", port: 9999 },
    { id: "p3", ipv4: "192.168.1.22", port: 9999 },
    { id: "p4", ipv4: "192.168.1.23", port: 9999 },
  ],
};

describe("bundled defaults and overlay resolution", () => {
  test("empty overlay resolves the bridge and all bundled plugs", () => {
    expect(resolveConfig(defaultsA, createEmptyUserConfigOverlay())).toEqual({
      bridge: defaultsA.bridge,
      plugs: defaultsA.plugs,
      favorites: [],
      settings: {},
    });
  });

  test("explicit bridge and seeded-plug overrides win", () => {
    const overlay: UserConfigOverlay = {
      ...createEmptyUserConfigOverlay(),
      bridgeOverride: { ipv4: "192.168.1.99" },
      plugOverrides: [{ id: "p2", ipv4: "192.168.1.88", port: 10000 }],
    };
    const resolved = resolveConfig(defaultsA, overlay);
    expect(resolved.bridge.ipv4).toBe("192.168.1.99");
    expect(resolved.plugs).toContainEqual({ id: "p2", ipv4: "192.168.1.88", port: 10000 });
  });

  test("removal outranks override and default, while additions are independent", () => {
    const overlay: UserConfigOverlay = {
      ...createEmptyUserConfigOverlay(),
      plugOverrides: [{ id: "p2", ipv4: "192.168.1.88", port: 9999 }],
      removedPlugIds: ["p2"],
      addedPlugs: [{ id: "user", ipv4: "192.168.1.50", port: 9999 }],
    };
    expect(() => validateUserConfigOverlay(defaultsA, overlay)).toThrow();
    const valid: UserConfigOverlay = {
      ...overlay,
      plugOverrides: [],
      removedPlugIds: ["p2"],
    };
    const resolved = resolveConfig(defaultsA, valid);
    expect(resolved.plugs.map((endpoint) => endpoint.id)).toEqual(["p1", "p3", "user"]);
  });

  test("A to B follows changed/new defaults only for untouched values", () => {
    const overlay: UserConfigOverlay = {
      ...createEmptyUserConfigOverlay(),
      plugOverrides: [{ id: "p2", ipv4: "192.168.1.88", port: 9999 }],
      removedPlugIds: ["p3"],
    };
    const resolved = resolveConfig(defaultsB, overlay);
    expect(resolved.bridge.ipv4).toBe("192.168.1.3");
    expect(resolved.plugs).toEqual([
      { id: "p1", ipv4: "192.168.1.20", port: 9999 },
      { id: "p2", ipv4: "192.168.1.88", port: 9999 },
      { id: "p4", ipv4: "192.168.1.23", port: 9999 },
    ]);
  });

  test("invalid bridge, endpoint, duplicate ID, and user-ID collision are rejected", () => {
    expect(() => validateUserConfigOverlay(defaultsA, {
      ...createEmptyUserConfigOverlay(),
      bridgeOverride: { ipv4: "8.8.8.8" },
    })).toThrow();
    expect(() => validateUserConfigOverlay(defaultsA, {
      ...createEmptyUserConfigOverlay(),
      plugOverrides: [
        { id: "p1", ipv4: "192.168.1.20", port: 9999 },
        { id: "p1", ipv4: "192.168.1.21", port: 9999 },
      ],
    })).toThrow();
    expect(() => validateUserConfigOverlay(defaultsA, {
      ...createEmptyUserConfigOverlay(),
      addedPlugs: [{ id: "p1", ipv4: "192.168.1.50", port: 9999 }],
    })).toThrow();
  });

  test("resolution is deterministic and overlay conversion canonicalizes equal values", () => {
    const resolved = resolveConfig(defaultsA, createEmptyUserConfigOverlay());
    const overlay = overlayFromConfig(defaultsA, resolved);
    expect(overlay).toEqual(createEmptyUserConfigOverlay());
    expect(resolveConfig(defaultsA, overlay)).toEqual(resolved);
  });

  test("overlay conversion records changed values, removals, and additions", () => {
    const overlay = overlayFromConfig(defaultsA, {
      bridge: { ipv4: "192.168.1.99" },
      plugs: [
        { id: "p1", ipv4: "192.168.1.10", port: 9999 },
        { id: "p2", ipv4: "192.168.1.88", port: 9999 },
        { id: "user", ipv4: "192.168.1.50", port: 9999 },
      ],
      favorites: [{ kind: "plug", plugEndpointId: "p2" }],
      settings: { theme: "dark" },
    });
    expect(overlay.bridgeOverride).toEqual({ ipv4: "192.168.1.99" });
    expect(overlay.plugOverrides).toEqual([{ id: "p2", ipv4: "192.168.1.88", port: 9999 }]);
    expect(overlay.removedPlugIds).toEqual(["p3"]);
    expect(overlay.addedPlugs).toEqual([{ id: "user", ipv4: "192.168.1.50", port: 9999 }]);
  });
});
