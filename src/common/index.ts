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
