/** @deprecated Import bundled defaults from ./bundledDefaults. */
import { BUNDLED_DEFAULTS, BundledPlugEndpoint, getBundledPlugPreseed } from "./bundledDefaults";

export { BundledPlugEndpoint, getBundledPlugPreseed };
export const BUNDLED_PLUG_PRESEED: readonly BundledPlugEndpoint[] = BUNDLED_DEFAULTS.plugs;
