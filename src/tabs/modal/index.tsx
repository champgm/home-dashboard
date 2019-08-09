// Why is this Necessary...
import React from "react";
import ReactNative, { ListView, Switch, Text, TextInput, View } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
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
  changeFieldCallback: (selectedItemId: string) => void ,
  disabled: boolean = false,
) {
  const styles = getStyles();
  console.log(`${allItems.length} items to display`);
  const lightSelectButtons = allItems.map((lightMeta) => {
    return (<AwesomeButton
      style={{ marginBottom: 10 }}
      key={lightMeta.id}
      onPress={() => changeFieldCallback(lightMeta.id)}
      accessibilityLabel={lightMeta.name}
      backgroundColor={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base01 : styles.solarized.base01}
      backgroundActive={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base02 : styles.solarized.base02}
      backgroundDarker={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base03 : styles.solarized.base03}
      textColor={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base1 : styles.solarized.base1}
      height={40}
      textSize={12}
      textLineHeight={15}
      disabled={disabled}
    >
      {` ${lightMeta.name} `}
    </AwesomeButton>);
  });
  const multiSelect = (
    <View style={styles.multiSelect}>
      {lightSelectButtons}
    </View>);
  return (
    <View style={[styles.multiSelectRow]}>
      <Text style={[styles.label]}>{label}:</Text>
      {multiSelect}
    </View>
  );
}
