import { legacyButtonPalette } from "../legacy/legacyButtonPalette";

export const legacyDashboardPalette = {
  base03: legacyButtonPalette.off.darkerFace,
  base02: legacyButtonPalette.off.activeFace,
  base01: legacyButtonPalette.off.face,
  base00: "#657b83",
  base0: "#839496",
  base1: legacyButtonPalette.off.text,
  base3: legacyButtonPalette.on.text,
  blue: legacyButtonPalette.known.face,
  orange: legacyButtonPalette.indeterminate.face,
  yellow: legacyButtonPalette.on.face,
} as const;

export type LegacyTileVisualState = "unknown" | "on" | "off" | "indeterminate" | "known";

export { getLegacyTileMetrics } from "../legacy/legacyButtonGeometry";

export function getLegacyTileColor(state: LegacyTileVisualState): string {
  switch (state) {
    case "on": return legacyButtonPalette.on.face;
    case "indeterminate": return legacyButtonPalette.indeterminate.face;
    case "known": return legacyButtonPalette.known.face;
    case "off": return legacyButtonPalette.off.face;
    default: return legacyButtonPalette.off.face;
  }
}
