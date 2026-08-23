export function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function changedFields<T extends Record<string, unknown>>(
  original: Partial<T> | undefined,
  draft: Partial<T>,
  allowedKeys: readonly (keyof T)[],
): Partial<T> {
  return allowedKeys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(draft, key)
      && !valuesEqual(original ? original[key] : undefined, draft[key])) {
      result[key] = draft[key] as T[typeof key];
    }
    return result;
  }, {} as Partial<T>);
}

export function mergeChangedFields<T extends Record<string, unknown>>(
  current: T,
  draft: Partial<T>,
  allowedKeys: readonly (keyof T)[],
): T {
  return { ...current, ...changedFields(current, draft, allowedKeys) };
}
