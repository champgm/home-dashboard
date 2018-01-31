import IItem from 'common/interfaces/IItem';
import ObjectUtil from 'common/util/ObjectUtil';
import ItemAttributeOrderUtil from 'common/util/attributeOrder/ItemAttributeOrderUtil';

export default class SceneAttributeOrderUtil extends ItemAttributeOrderUtil {
  static orderedFields: string[] = [
    'id',
    'name',
    'version',
    'owner',
    'locked',
    'lights',
    'lightstates',
    'storelightstate',
    'lastupdated'
  ];

  // public static getOrderedFields(item: IItem, itemKey: string): string[] {
  //   if (ObjectUtil.notEmpty(item)) {
  //     const allKeys: string[] = Object.keys(item);
  //     SceneAttributeOrderUtil.orderedFields.forEach((field) => {
  //       const fieldIndex: number = allKeys.indexOf(field);
  //       if (fieldIndex > -1) {
  //         allKeys.splice(fieldIndex, 1);
  //       }
  //     });
  //     const result: string[] = SceneAttributeOrderUtil.orderedFields.concat(allKeys);
  //     return result;
  //   }
  //   return [];
  // }
}
