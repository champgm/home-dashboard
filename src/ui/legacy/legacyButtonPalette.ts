export interface LegacyButtonRoleColors {
  readonly face: string;
  readonly activeFace: string;
  readonly darkerFace: string;
  readonly text: string;
}

const base03 = "#002b36";
const base02 = "#073642";
const base01 = "#586e75";
const base1 = "#93a1a1";
const base3 = "#fdf6e3";

export const legacyButtonPalette = {
  off: {
    face: base01,
    activeFace: base02,
    darkerFace: base02,
    text: base1,
  },
  on: {
    face: "#b58900",
    activeFace: "#806600",
    darkerFace: "#5f4a00",
    text: base3,
  },
  indeterminate: {
    face: "#cb4b16",
    activeFace: "#96370f",
    darkerFace: "#702909",
    text: base3,
  },
  known: {
    face: "#268bd2",
    activeFace: "#1d6caa",
    darkerFace: "#15517f",
    text: base3,
  },
  utility: {
    face: "#6c71c4",
    activeFace: "#565aa0",
    darkerFace: "#414579",
    text: base3,
  },
  edit: {
    face: "#268bd2",
    activeFace: "#1d6caa",
    darkerFace: "#15517f",
    text: base3,
  },
  favoriteInactive: {
    face: base01,
    activeFace: base02,
    darkerFace: base02,
    text: base3,
  },
  favoriteActive: {
    face: "#b58900",
    activeFace: "#806600",
    darkerFace: "#5f4a00",
    text: base3,
  },
} as const satisfies Record<string, LegacyButtonRoleColors>;

export type LegacyButtonVisualState = keyof Pick<typeof legacyButtonPalette, "off" | "on" | "indeterminate" | "known">;

export function getLegacyButtonColors(state: LegacyButtonVisualState): LegacyButtonRoleColors {
  return legacyButtonPalette[state];
}
