export const legacyDashboardPalette = {
  base03: "#002b36",
  base02: "#073642",
  base01: "#586e75",
  base00: "#657b83",
  base0: "#839496",
  base1: "#93a1a1",
  base3: "#fdf6e3",
  blue: "#268bd2",
  orange: "#cb4b16",
  yellow: "#b58900",
} as const;

export type LegacyTileVisualState = "unknown" | "on" | "off" | "indeterminate" | "known";

export function getLegacyTileMetrics(width: number): { tile: number; action: number; margin: number } {
  const margin = Math.max(4, Math.round(width * 0.01));
  const tile = Math.max(72, Math.floor(width * 0.2));
  return { tile, action: Math.max(24, Math.floor(tile / 3)), margin };
}

export function getLegacyTileColor(state: LegacyTileVisualState): string {
  switch (state) {
    case "on": return legacyDashboardPalette.yellow;
    case "indeterminate": return legacyDashboardPalette.orange;
    case "known": return legacyDashboardPalette.blue;
    case "off": return legacyDashboardPalette.base01;
    default: return legacyDashboardPalette.base01;
  }
}
