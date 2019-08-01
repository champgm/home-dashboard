// Why is this Necessary...
import React from "react";
import ReactNative, { ListView, Text, TextInput, View } from "react-native";
import { getStyles } from "../common/Style";

export const getNameRow2 = () => (
  <View style={[getStyles().fieldRow]}>
    <Text style={[getStyles().label]}>Name:</Text>
    <TextInput
      value={this.state.group.name}
      style={[getStyles().input]}
      onChangeText={(text) => this.changeField(text, "name")}
    />
  </View>);

export function getStringInputRow(
  label: string,
  fieldName: string,
  initialValue: string,
  editable: boolean,
  changeFieldCallback?: (text: string, fieldName: string) => void,
): JSX.Element {
  try {
    console.log(`label: ${label}`);
    console.log(`fieldName: ${fieldName}`);
    console.log(`initialValue: ${initialValue}`);
    console.log(`editable: ${editable}`);
    const styles = getStyles();
    return (
      <View style={[styles.fieldRow]}>
        <Text style={[styles.label]}>{label}:</Text>
        <TextInput
          value={initialValue}
          editable={editable}
          style={[styles.input]}
          onChangeText={(text) => changeFieldCallback(text, fieldName)}
        />
      </View>);
  } catch (error) {
    console.log(`Error creating input row${JSON.stringify(error, null, 2)}`);
    throw error;
  }
}
