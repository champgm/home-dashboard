
export function verifyType<T>(
  value: T,
  fieldName: string,
  type: string,
  required: boolean = true,
): T {
  if ((value === null || typeof value === "undefined") && !required) {
    return value;
  }
  if (typeof value !== type) {
    throw new Error(`Field, '${fieldName}' ` +
      `is of type, '${typeof value}' ` +
      `but should be of type, '${type}'`);
  }
  return value;
}

export function verifyArray<T>(
  values: T[],
  fieldName: string,
  type: string,
  required: boolean = true,
): T[] {
  if ((values === null || typeof values === "undefined") && !required) {
    return values;
  }
  if (!Array.isArray(values)) {
    throw new Error(`Field, '${fieldName}' ` +
      `is of type, '${typeof values}' ` +
      `but should be of type, 'Array'`);
  }
  for (const value of values) {
    if (typeof value !== type) {
      throw new Error(`Item within Field, '${fieldName}' ` +
        `is of type, '${typeof value}' ` +
        `but should be of type, '${type}'`);
    }
  }
  return values;
}

export function createArray<T>(
  value: any[], fieldName: string,
  create: (payload: any) => T,
  required: boolean = true,
): T[] {
  if ((value === null || typeof value === "undefined") && !required) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`Field, '${fieldName}' ` +
      `is of type, '${typeof value}' ` +
      `but should be of type, 'Array'`);
  }
  return value.map((arrayItem) => create(arrayItem));
}

export function printLeftoverKeys(modelType: string, first: any, second: any) {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  const difference = firstKeys
    .filter((key) => !secondKeys.includes(key))
    .concat(secondKeys.filter((key) => !firstKeys.includes(key)))
    .filter((key) => !(first[key] === undefined && second[key] === undefined));

  if (!(difference.length === 0)) {
    console.log(`Key difference in model, '${modelType}' detected: ${JSON.stringify(difference, null, 2)}`);
  }
}
