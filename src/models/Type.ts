export enum Type {
  GROUP = "group",
  LIGHT = "light",
}

export function verify(type: Type): Type {
  if (!Object.values(Type).includes(type)) {
    throw new Error(`Type, '${type}' ` +
      `is not a valid Type. ` +
      `Valid Types: ${JSON.stringify(Type)}`);
  }
  return type;
}
