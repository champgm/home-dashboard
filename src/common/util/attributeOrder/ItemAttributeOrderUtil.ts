import IItem from 'common/interfaces/IItem';
import ObjectUtil from 'common/util/ObjectUtil';



export default abstract class ItemAttributeOrderUtil {
  static orderedFields: string[] = [];

  public static getOrderedFields(item: IItem, itemKey: string): string[] {
    if (ObjectUtil.notEmpty(item)) {
      const allKeys: string[] = Object.keys(item);
      this.orderedFields.forEach((field) => {
        const fieldIndex: number = allKeys.indexOf(field);
        if (fieldIndex > -1) {
          allKeys.splice(fieldIndex, 1);
        }
      });
      const result: string[] = this.orderedFields.concat(allKeys);
      return result;
    }
    return [];
  }
}
