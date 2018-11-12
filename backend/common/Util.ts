import _isString from 'lodash.isstring';
import _trim from 'lodash.trim';
import _isEmpty from 'lodash.isempty';
import _isObject from 'lodash.isobject';

export function isEmptyOrBlank(thing: any): boolean {
  if (_isString(thing)) {
    return _isEmpty(_trim(thing));
  }
  return isEmpty(thing);
}

export function notEmptyOrBlank(thing: any): boolean {
  return !isEmptyOrBlank(thing);
}

function isEmpty(thing: any): boolean {
  if (thing === undefined || thing === null) {
    return true;
  }
  if (_isObject(thing)) {
    return _isEmpty(thing);
  }
  return false;
}


// This is a wrapper for all route handlers
// We need to take special care to handle asynchronous errors. Lambda has a tendency to eat them
export function asyncHandler(
  handler: (request: any, response: any) => Promise<any>,
): (request: any, response: any, next: () => void) => void {
  return (request: any, response: any, next: (error: any) => void): void => {
    // Call the handler
    handler(request, response)
      // Log and return the response
      .then((responseObject) => {
        response.status(responseObject.code).json(responseObject);
      })
      .catch((error) => {
        // Pass it on to the global handler
        next(error);
      });
  };
}
