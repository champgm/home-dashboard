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
import PlugAttributeOrderUtil from 'common/util/attributeOrder/PlugAttributeOrderUtil';

export default class ItemUtil {
  static fieldsToRedact: string[] = [
    'appdata',
    'picture',
    'class'
  ];
  static commonUneditableFields: string[] = [
    'id',
    'version',
    'owner',
    'uniqueid',
    'swversion'
  ];

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

  public static getUneditableFields(itemType: string): string[] {
    switch (itemType) {
      case 'scenes':
        return []
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
      case 'lights':
        return ['type', 'modelid', 'manufacturername', 'luminaireuniqueid', 'streaming']
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
      case 'plugs':
        return ['err_code', 'sw_ver', 'hw_ver', 'type', 'model', 'mac', 'deviceid', 'hwid', 'fwid',
          'oemid', 'alias', 'dev_name', 'icon_hash', 'relay_state', 'on_time', 'active_mode', 'feature',
          'updating', 'rssi', 'led_off', 'latitude', 'longitude', 'state']
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
      case 'groups':
        return ['action', 'type', 'modelid', 'class']
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
      case 'schedules':
        return ['starttime']
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
      case 'sensors':
        return ['modelid', 'type', 'manufacturername', 'state', 'config', 'recycle']
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
      case 'rules':
        return ['created', 'lasttriggered', 'timestriggered', 'recycle']
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
      default:
        return []
          .concat(ItemUtil.commonUneditableFields)
          .concat(ItemUtil.fieldsToRedact);
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
      case 'plugs':
        return PlugAttributeOrderUtil.getOrderedFields(item, itemKey);
      default:
        if (ObjectUtil.notEmpty(item)) {
          return Object.keys(item);
        }
        return [];
    }
  }
}
