import IItem from 'common/interfaces/IItem';
import ObjectUtil from 'common/util/ObjectUtil';
import ItemAttributeOrderUtil from 'common/util/attributeOrder/ItemAttributeOrderUtil';

export default class ScheduleAttributeOrderUtil extends ItemAttributeOrderUtil {
  static orderedFields: string[] = [
    'name',
    'id',
    'description',
    'status',
    'time',
    'localtime',
    'command'
  ];
}
