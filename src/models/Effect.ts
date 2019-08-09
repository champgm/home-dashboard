export enum Effect {
  NONE = "none",
  COLORLOOP = "colorloop",
}

export function verify(effect: Effect): Effect {
  if (!Object.values(Effect).includes(effect)) {
    throw new Error(`Effect, '${effect}' ` +
      `is not a valid Effect. ` +
      `Valid Effects: ${JSON.stringify(Effect)}`);
  }
  return effect;
}
