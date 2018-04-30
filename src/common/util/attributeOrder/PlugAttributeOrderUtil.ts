import ObjectUtil from 'common/util/ObjectUtil';
import ItemAttributeOrderUtil from 'common/util/attributeOrder/ItemAttributeOrderUtil';

export default class PlugAttributeOrderUtil extends ItemAttributeOrderUtil {
  static orderedFields: string[] = [
    'name',
    'id',
    'type'
  ];
}
