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
