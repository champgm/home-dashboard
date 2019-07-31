import _ from "lodash";

export function revealAllProperties(object: any): any {
  const objectReferences: any[] = [];

  do {
    objectReferences.unshift(object);
    // tslint:disable-next-line: no-parameter-reassignment
  } while (object = Object.getPrototypeOf(object));

  const enumeratedObject: any = {};
  for (const objectReference of objectReferences) {
    Object.getOwnPropertyNames(objectReference).forEach((property) => {
      enumeratedObject[property] = _.clone(objectReference[property]);
    });
  }

  return enumeratedObject;
}

export function sortBy<T>(objects: T[], fieldName: string): T[] {
  return objects.sort((a, b) => {
    if (a[fieldName] < b[fieldName]) { return -1; }
    if (a[fieldName] > b[fieldName]) { return 1; }
    return 0;
  });
}

export const style = {
  backgroundColor: "#002b36",
};
