import IItem from 'common/interfaces/IItem';
import ObjectUtil from 'common/util/ObjectUtil';
import ItemAttributeOrderUtil from 'common/util/attributeOrder/ItemAttributeOrderUtil';

export default class GroupAttributeOrderUtil extends ItemAttributeOrderUtil {
  static orderedFields: string[] = [
    'name',
    'id',
    'type',
    'class',
    'lights',
    'state',
    'action'
  ];
}
