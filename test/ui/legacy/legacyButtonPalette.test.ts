import { getLegacyButtonColors, legacyButtonPalette } from "../../../src/ui/legacy/legacyButtonPalette";

describe("legacy button palette", () => {
  test("keeps each state on its explicit face/active/lower/text roles", () => {
    expect(getLegacyButtonColors("on")).toEqual(legacyButtonPalette.on);
    expect(getLegacyButtonColors("off")).toEqual(legacyButtonPalette.off);
    expect(getLegacyButtonColors("indeterminate")).toEqual(legacyButtonPalette.indeterminate);
    expect(getLegacyButtonColors("known")).toEqual(legacyButtonPalette.known);
    expect(new Set([
      legacyButtonPalette.on.face,
      legacyButtonPalette.off.face,
      legacyButtonPalette.indeterminate.face,
      legacyButtonPalette.known.face,
      legacyButtonPalette.utility.face,
    ]).size).toBe(5);
  });

  test("uses the yellow active palette only for an active Favorite", () => {
    expect(legacyButtonPalette.favoriteActive.face).toBe(legacyButtonPalette.on.face);
    expect(legacyButtonPalette.favoriteInactive.face).toBe(legacyButtonPalette.off.face);
  });

  test("keeps the neutral lower face visible against the dashboard background", () => {
    expect(legacyButtonPalette.off.darkerFace).not.toBe("#002b36");
    expect(legacyButtonPalette.favoriteInactive.darkerFace).toBe(legacyButtonPalette.off.darkerFace);
  });
});
