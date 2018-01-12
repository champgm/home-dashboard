import * as _ from 'lodash';

export default class ObjectUtil {
  public static isArrayEmpty(arrayObj: any[]): boolean {
    if (ObjectUtil.isNull(arrayObj) || (arrayObj.constructor === Array && arrayObj.length === 0)) {
      return true;
    }
    if (arrayObj instanceof Array) {
      const value: any = arrayObj.find((element: any) => !ObjectUtil.isNull(element));
      return ObjectUtil.isNull(value);
    }
    return false;
  }

  public static isEmptyObject(obj: any): boolean {
    if (ObjectUtil.isNull(obj)) {
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
    if (ObjectUtil.isNull(strVal)) {
      return true;
    }
    if (!_.isString(strVal)) {
      return false;
    }
    const trimmed: string = strVal.trim();
    return trimmed === '';
  }

  public static notEmpty(object: any): boolean {
    return !ObjectUtil.isEmpty(object);
  }

  public static isEmpty(object: any): boolean {
    return ObjectUtil.isEmptyString(object) ||
      ObjectUtil.isEmptyObject(object) ||
      ObjectUtil.isArrayEmpty(object);
  }
}
