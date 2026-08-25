import { getLegacyButtonGeometry, getLegacyTileMetrics } from "../../../src/ui/legacy/legacyButtonGeometry";

describe("legacy button geometry", () => {
  test("derives the compact Pixel portrait tile from the legacy ratios", () => {
    const metrics = getLegacyTileMetrics(432);
    expect(metrics.tile).toBe(77);
    expect(metrics.action).toBeCloseTo(77 / 3);
    expect(metrics.margin).toBe(4);
  });

  test("keeps the mini controls in the lower overlapping corners", () => {
    const geometry = getLegacyButtonGeometry(432);
    expect(geometry.miniDimension).toBeCloseTo(geometry.mainDimension / 3);
    expect(geometry.editPosition.left).toBeCloseTo(geometry.mainDimension * 0.75);
    expect(geometry.favoritePosition.left).toBeCloseTo(-(geometry.mainDimension * 0.06));
    expect(geometry.editPosition.top).toBeLessThan(geometry.mainDimension);
    expect(geometry.favoritePosition.top).toBe(geometry.editPosition.top);
    expect(geometry.legacyFavoriteOffset.top).toBeLessThan(0);
  });

  test("falls back to a usable compact width for invalid measurements", () => {
    expect(getLegacyTileMetrics(Number.NaN).tile).toBe(72);
    expect(getLegacyTileMetrics(0).margin).toBe(4);
  });
});
