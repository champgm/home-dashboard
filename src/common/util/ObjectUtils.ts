import * as _ from 'lodash';

export default class ObjectUtils {
  public static isArrayEmpty(arrayObj: any[]): boolean {
    if (ObjectUtils.isNull(arrayObj) || (arrayObj.constructor === Array && arrayObj.length === 0)) {
      return true;
    }
    if (arrayObj instanceof Array) {
      const value: any = arrayObj.find((element: any) => !ObjectUtils.isNull(element));
      return ObjectUtils.isNull(value);
    }
    return false;
  }

  public static isEmptyObject(obj: any): boolean {
    if (ObjectUtils.isNull(obj)) {
      return true;
    }
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  public static isNull(obj: any): boolean {
    return obj === null || obj === undefined;
  }

  public static isNullOrEmpty(val: any): boolean {
    if (val === undefined || val === null || val.trim() === '') {
      return true;
    }
    return false;
  }

  public static isString(x: any): boolean {
    return typeof x === 'string';
  }

  public static isEmptyString(strVal: string): boolean {
    if (ObjectUtils.isNull(strVal)) {
      return true;
    }
    if (!_.isString(strVal)) {
      return false;
    }
    const trimmed: string = strVal.trim();
    return trimmed === '';
  }

  public static notEmpty(object: any): boolean {
    return !ObjectUtils.isEmpty(object);
  }

  public static isEmpty(object: any): boolean {
    return ObjectUtils.isEmptyString(object) ||
      ObjectUtils.isEmptyObject(object) ||
      ObjectUtils.isArrayEmpty(object);
  }
}
