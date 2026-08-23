import { validatePlugEndpoint, validatePrivateIpv4 } from "./endpointValidation";

export interface BundledPlugEndpoint {
  readonly id: string;
  readonly ipv4: string;
  readonly port: number;
}

export interface BundledDefaults {
  readonly bridge: {
    readonly ipv4?: string;
  };
  readonly plugs: readonly BundledPlugEndpoint[];
}

export const BUNDLED_HUE_BRIDGE_IPV4: string | undefined = '192.168.2.85';

const UNVALIDATED_BUNDLED_DEFAULTS: BundledDefaults = {
  bridge: BUNDLED_HUE_BRIDGE_IPV4 ? { ipv4: BUNDLED_HUE_BRIDGE_IPV4 } : {},
  plugs: [
    { id: "TP-Link-Macs-Desk", ipv4: "192.168.2.219", port: 9999 },
    { id: "TP-LINK-Plug-2", ipv4: "192.168.2.210", port: 9999 },
    { id: "TP-LINK-Plug-3", ipv4: "192.168.2.211", port: 9999 },
    { id: "TP-LINK-Plug-With-Monitor-1", ipv4: "192.168.2.218", port: 9999 },
    { id: "TP-LINK-Plug-With-Monitor-2", ipv4: "192.168.2.226", port: 9999 },
    { id: "TP-Link-Small-1", ipv4: "192.168.2.220", port: 9999 },
    { id: "TP-Link-Small-2", ipv4: "192.168.2.221", port: 9999 },
    { id: "TP-Link-Small-3", ipv4: "192.168.2.225", port: 9999 },
    { id: "TP-Link-Small-Outside", ipv4: "192.168.2.223", port: 9999 },
    { id: "TPLink-TV-Peripherals", ipv4: "192.168.2.214", port: 9999 },
  ],
};

export function validateBundledDefaults(input: BundledDefaults): BundledDefaults {
  if (!input || typeof input !== "object" || !input.bridge || !Array.isArray(input.plugs)) {
    throw new Error("Bundled defaults must contain a bridge object and plug array.");
  }
  let bridge: BundledDefaults["bridge"] = {};
  if (input.bridge.ipv4 !== undefined) {
    const validation = validatePrivateIpv4(input.bridge.ipv4);
    if (!validation.valid) {
      throw new Error(`Invalid bundled Hue bridge IPv4: ${validation.error?.message || "invalid address"}`);
    }
    bridge = { ipv4: validation.value };
  }
  const ids = new Set<string>();
  const plugs = input.plugs.map((candidate, index) => {
    if (!candidate || typeof candidate.id !== "string" || candidate.id.trim() !== candidate.id || candidate.id.length === 0) {
      throw new Error(`Bundled plug ${index} has no stable ID.`);
    }
    if (ids.has(candidate.id)) {
      throw new Error(`Bundled plug ID is duplicated: ${candidate.id}`);
    }
    ids.add(candidate.id);
    const endpoint = validatePlugEndpoint(candidate);
    return { id: candidate.id, ipv4: endpoint.ipv4, port: endpoint.port };
  });
  return { bridge, plugs };
}

export const BUNDLED_DEFAULTS: BundledDefaults = validateBundledDefaults(UNVALIDATED_BUNDLED_DEFAULTS);

export function getBundledDefaults(source: BundledDefaults = BUNDLED_DEFAULTS): BundledDefaults {
  return validateBundledDefaults(source);
}

/** @deprecated Use bundled defaults and resolveConfig instead. */
export function getBundledPlugPreseed(source: readonly BundledPlugEndpoint[] = BUNDLED_DEFAULTS.plugs): BundledPlugEndpoint[] {
  return validateBundledDefaults({ bridge: {}, plugs: source }).plugs.map((endpoint) => ({ ...endpoint }));
}
