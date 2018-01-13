import IMap from '../interfaces/IMap';
import IItem from '../interfaces/IItem';
import ObjectUtil from '../util/ObjectUtil';
import * as traverse from 'traverse';

export default class ItemUtil {
  static fieldsToRedact: string[] = [
    'appdata',
    'picture',
    'recycle'
  ];
  static uneditableFields: string[] = [
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
    'description',
    'id',
    'lightstates',
    'buttonevent',
    'battery',
    'lasttriggered',
    'timestriggered'
  ].concat(ItemUtil.fieldsToRedact);

  public static getKeysSortedByName(object: IMap<IItem>): string[] {
    if (ObjectUtil.notEmpty(object)) {
      const keysSortedByName: string[] = Object.keys(object).sort((itemKeyA, itemKeyB) => {
        return object[itemKeyA].name.localeCompare(object[itemKeyB].name);
      });
      return keysSortedByName;
    }
    return [];
  }

  public static booleansToStrings(item: any): any {
    const traversable: any = traverse(item);
    return traversable.map(function (value: any): any {
      if (ObjectUtil.notEmpty(this.key)) {
        // bunyanLogger.info({ this: this }, 'this');
        if (typeof this.node === 'boolean') {
          if (this.node) {
            this.update('true');
          } else {
            this.update('false');
          }
        }
      }
    });
  }

  public static stringsToBooleans(item: any): IItem {
    const traversable: any = traverse(item);
    return traversable.map(function (value: any): any {
      if (ObjectUtil.notEmpty(this.key)) {
        if (this.node === 'true') {
          this.update(true);
        } else if (this.node === 'false') {
          this.update(false);
        }
      }
    });
  }
}
