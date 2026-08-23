import { DEFAULT_TPLINK_PORT } from "./endpointValidation";

export interface BundledPlugEndpoint {
  readonly id: string;
  readonly ipv4: string;
  readonly port: number;
}

/*
 * Deployment-specific addresses are intentionally not guessed. The array is a
 * bundled, replaceable data boundary: a household build can add its known
 * static endpoints, while a clean checkout starts without phantom devices.
 */
export const BUNDLED_PLUG_PRESEED: readonly BundledPlugEndpoint[] = [];

export function getBundledPlugPreseed(
  source: readonly BundledPlugEndpoint[] = BUNDLED_PLUG_PRESEED,
): BundledPlugEndpoint[] {
  return source.map((endpoint) => ({
    id: endpoint.id,
    ipv4: endpoint.ipv4,
    port: endpoint.port || DEFAULT_TPLINK_PORT,
  }));
}
