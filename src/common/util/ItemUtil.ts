import IMap from '../interfaces/IMap';
import IItem from '../interfaces/IItem';
import ObjectUtil from '../util/ObjectUtil';

export default class ItemUtil {

  public static getKeysSortedByName(object: IMap<IItem>): string[] {
    if (ObjectUtil.notEmpty(object)) {
      const keysSortedByName: string[] = Object.keys(object).sort((itemKeyA, itemKeyB) => {
        return object[itemKeyA].name.localeCompare(object[itemKeyB].name);
      });
      return keysSortedByName;
    }
    return [];
  }

  static getFieldsToRedact(): string[] {
    return [
      'appdata',
      'picture',
      'recycle'
    ];
  }

  static getUneditableFields(): string[] {
    return [
      'type',
      'modelid',
      'manufacturername',
      'uniqueid',
      'swversion',
      'reachable',
      'version',
      'owner',
      'locked',
      'lastupdated',
      'all_on',
      'any_on',
      'created',
      'address',
      'description'
    ];
  }
}
