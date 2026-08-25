// The original dashboard left enough room between its four columns for short
// two-word names such as "Bedside Mac" to wrap instead of spanning one line.
export const LEGACY_TILE_WIDTH_RATIO = 0.18;
export const LEGACY_OUTER_MARGIN_RATIO = 0.01;
export const LEGACY_MINI_BUTTON_RATIO = 1 / 3;
export const LEGACY_OVERLAP_RATIO = 1 / 5.5;

export interface LegacyTileMetrics {
  readonly tile: number;
  readonly action: number;
  readonly margin: number;
}

export interface LegacyButtonGeometry extends LegacyTileMetrics {
  readonly mainDimension: number;
  readonly miniDimension: number;
  readonly overlap: number;
  readonly editPosition: { readonly top: number; readonly left: number };
  readonly favoritePosition: { readonly top: number; readonly left: number };
  /** The offsets used by the legacy component before its children were translated into an overlay layer. */
  readonly legacyEditOffset: { readonly top: number; readonly left: number };
  readonly legacyFavoriteOffset: { readonly top: number; readonly left: number };
}

/**
 * Derive the compact dashboard geometry from the old ItemButton formulas.
 * Keeping this pure makes the visual contract testable without a device or a
 * React Native window singleton.
 */
export function getLegacyTileMetrics(width: number): LegacyTileMetrics {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 320;
  const margin = Math.max(4, Math.round(safeWidth * LEGACY_OUTER_MARGIN_RATIO));
  const tile = Math.max(72, Math.floor(safeWidth * LEGACY_TILE_WIDTH_RATIO));
  return {
    tile,
    action: tile * LEGACY_MINI_BUTTON_RATIO,
    margin,
  };
}

export function getLegacyButtonGeometry(width: number): LegacyButtonGeometry {
  const metrics = getLegacyTileMetrics(width);
  const overlap = metrics.tile * LEGACY_OVERLAP_RATIO;

  return {
    ...metrics,
    mainDimension: metrics.tile,
    miniDimension: metrics.action,
    overlap,
    // The old buttons were laid out after the main button and shifted by the
    // overlap amount. Absolute overlay positions preserve the resulting lower
    // corner placement while preventing normal-flow height from changing.
    editPosition: {
      top: metrics.tile - overlap,
      left: metrics.tile * 0.75,
    },
    favoritePosition: {
      top: metrics.tile - overlap,
      left: -(metrics.tile * 0.06),
    },
    legacyEditOffset: {
      top: -overlap,
      left: metrics.tile * 0.75,
    },
    legacyFavoriteOffset: {
      top: -(metrics.action + overlap),
      left: -(metrics.tile * 0.06),
    },
  };
}
