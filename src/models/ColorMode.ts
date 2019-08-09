export enum ColorMode {
  HS = "hs",
  XY = "xy",
  CT = "ct",
}

export function verify(colorMode: ColorMode): ColorMode {
  if (!Object.values(ColorMode).includes(colorMode)) {
    throw new Error(`ColorMode, '${colorMode}' ` +
      `is not a valid ColorMode. ` +
      `Valid ColorModes: ${JSON.stringify(ColorMode)}`);
  }
  return colorMode;
}
