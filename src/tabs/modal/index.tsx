// Why is this Necessary...
import React from "react";
import ReactNative, { ListView, Switch, Text, TextInput, View } from "react-native";
import MultiSelect from "react-native-multiple-select";
import { getStyles } from "../common/Style";

export function getLabelOnlyRow(label: string) {
  const styles = getStyles();
  return (
    <View style={[styles.fieldRow]}>
      <Text style={[styles.label]}>{label}:</Text>
    </View>);
}

export function getStringInputRow(
  label: string,
  fieldName: string,
  initialValue: string,
  editable: boolean,
  changeFieldCallback?: (text: string, fieldName: string) => void,
): JSX.Element {
  const styles = getStyles();
  return (
    <View style={[styles.fieldRow]}>
      <Text style={[styles.label]}>{label}:</Text>
      <TextInput
        value={initialValue}
        editable={editable}
        style={[editable ? styles.input : styles.lockedInput]}
        onChangeText={(value) => changeFieldCallback(value, fieldName)}
      />
    </View>);
}

export function getToggleRow(
  label: string,
  fieldName: string,
  initialValue: boolean,
  editable: boolean,
  changeFieldCallback?: (newValue: boolean, fieldName: string) => void,
): JSX.Element {
  const styles = getStyles();
  return (
    <View style={[styles.fieldRow]}>
      <Text style={[styles.label]}>{label}:</Text>
      <Switch
        value={initialValue}
        disabled={!editable}
        style={[editable ? styles.toggle : styles.lockedToggle]}
        onValueChange={(value) => changeFieldCallback(value, fieldName)}
      />
    </View>);
}

export function getMultiSelectRow(
  label: string,
  initiallySelectedItems: string[],
  allItems: Array<{ id: string, name: string }>,
  changeFieldCallback: (items: any[]) => void,
) {
  const styles = getStyles();
  console.log(`initiallySelectedItems: ${JSON.stringify(initiallySelectedItems)}`);
  let multiSelectRef: MultiSelect;
  const multiSelect = (<MultiSelect
    hideTags
    items={allItems}
    uniqueKey="id"
    ref={(component) => {
      // console.log(`ref called ???`);
      multiSelectRef = component;
    }}
    onSelectedItemsChange={(newlySelectedItems) => changeFieldCallback(newlySelectedItems)}
    selectedItems={initiallySelectedItems}
    selectText="Pick Lights"
    // onChangeInput={(text) => console.log(text)}
    altFontFamily="ProximaNova-Light"
    tagRemoveIconColor="#CCC"
    tagBorderColor="#CCC"
    tagTextColor="#CCC"
    selectedItemTextColor="#CCC"
    selectedItemIconColor="#CCC"
    itemTextColor="#000"
    displayKey="name"
    searchInputStyle={{ color: "#CCC" }}
    submitButtonColor="#CCC"
    submitButtonText="Submit"
    textInputProps={{ editable: false }}
  />);
  const selectedItems = multiSelectRef
    ? <View>{multiSelectRef.getSelectedItemsExt(initiallySelectedItems)}</View>
    : <View></View>;
  return (
    // <View style={[styles.fieldRow]}>
    //   <Text style={[styles.label]}>{label}:</Text>
    <View>
      {multiSelect}
      {selectedItems}
    </View>
  );
}
