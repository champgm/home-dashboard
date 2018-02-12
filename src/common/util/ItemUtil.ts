import IMap from '../interfaces/IMap';
import IItem from '../interfaces/IItem';
import ObjectUtil from '../util/ObjectUtil';
import * as traverse from 'traverse';
import SceneAttributeOrderUtil from 'common/util/attributeOrder/SceneAttributeOrderUtil';
import LightAttributeOrderUtil from 'common/util/attributeOrder/LightAttributeOrderUtil';
import GroupAttributeOrderUtil from 'common/util/attributeOrder/GroupAttributeOrderUtil';
import ScheduleAttributeOrderUtil from 'common/util/attributeOrder/ScheduleAttributeOrderUtil';
import SensorAttributeOrderUtil from 'common/util/attributeOrder/SensorAttributeOrderUtil';
import RuleAttributeOrderUtil from 'common/util/attributeOrder/RuleAttributeOrderUtil';

export default class ItemUtil {
  static fieldsToRedact: string[] = [
    'appdata',
    'picture'
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
    'timestriggered',
    '_eventsCount',
    'host',
    'port',
    'timeout',
    'inUseThreshold'
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

  public static isSelected(item: IItem, itemType: string): boolean {
    switch (itemType) {
      case 'lights':
      case 'plugs':
        if (!item || !item.state) {
          return false;
        }
        return item.state.on;
      default:
        return true;
    }
  }

  public static getItemAttributeList(item: IItem, itemType: string, itemKey: string): string[] {
    if (!ObjectUtil.isEmpty(itemKey)) {
      if (ObjectUtil.notEmpty(item)) {
        return Object.keys(item);
      }
      return [];
    }

    switch (itemType) {
      case 'scenes':
        return SceneAttributeOrderUtil.getOrderedFields(item, itemKey);
      case 'lights':
        return LightAttributeOrderUtil.getOrderedFields(item, itemKey);
      case 'groups':
        return GroupAttributeOrderUtil.getOrderedFields(item, itemKey);
      case 'schedules':
        return ScheduleAttributeOrderUtil.getOrderedFields(item, itemKey);
      case 'sensors':
        return SensorAttributeOrderUtil.getOrderedFields(item, itemKey);
      case 'rules':
        return RuleAttributeOrderUtil.getOrderedFields(item, itemKey);
      default:
        if (ObjectUtil.notEmpty(item)) {
          return Object.keys(item);
        }
        return [];
    }
  }
}
