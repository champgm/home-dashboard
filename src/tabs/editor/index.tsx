// Why is this Necessary...
import React from "react";
import * as ColorPicker2 from "react-colorizer";
import { Switch, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { ColorPicker, TriangleColorPicker } from "react-native-color-picker";
import AwesomeButton from "react-native-really-awesome-button";
import { createBasesFromColor, rgb, rgbStrings as solarized } from "solarizer";
import { RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import { getStyles } from "../common/Style";

export function getLabelOnlyRow(label: string) {
  const styles = getStyles();
  return (
    <View style={[styles.fieldRow]}>
      <Text style={[styles.label]}>{label}:</Text>
    </View>);
}
export function getTitle(
  itemType: string,
  itemId: string,
  name: string,
  changeFieldCallback?: (text: string, fieldName: string) => void,
) {
  const styles = getStyles();
  return (
    <View style={[styles.titleRow]}>
      <Text style={[styles.titleLabel]}>{`${itemType} ${itemId}`}</Text>
      <TextInput
        value={name}
        editable={true}
        style={styles.titleInput}
        onChangeText={(value) => changeFieldCallback(value, "name")}
      />
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
        style={editable ? styles.input : styles.lockedInput}
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

export enum Status { ON, OFF, INDETERMINATE }
export interface StatusToggleStatus {
  onText: string; offText: string; indeterminateText: string;
  onBaseColor: string; offBaseColor: string; indeterminateBaseColor: string;
}
export interface StatusToggleActions {
  turnOnText: string; turnOffText: string;
  turnOnBaseColor: string; turnOffBaseColor: string;
}
export function getStatusToggleRow(
  key: string,
  fieldName: string,
  statusToggleStatus: StatusToggleStatus,
  statusToggleActions: StatusToggleActions,
  statusFunction: () => Status,
  toggleCallback: (newValue: boolean, fieldName: string) => void,
): JSX.Element {
  const styles = getStyles();
  let statusColors: RgbBaseStringMap;
  let statusText: string;
  let statusActionColors: RgbBaseStringMap;
  let statusActionText: string;
  let countsAsOn: boolean;
  switch (statusFunction()) {
    case Status.ON:
      statusColors = createBasesFromColor(statusToggleStatus.onBaseColor, "base01");
      statusText = statusToggleStatus.onText;
      statusActionColors = createBasesFromColor(statusToggleActions.turnOffBaseColor, "base01");
      statusActionText = statusToggleActions.turnOffText;
      countsAsOn = true;
      break;
    case Status.OFF:
      statusColors = createBasesFromColor(statusToggleStatus.offBaseColor, "base01");
      statusText = statusToggleStatus.offText;
      statusActionColors = createBasesFromColor(statusToggleActions.turnOnBaseColor, "base01");
      statusActionText = statusToggleActions.turnOnText;
      countsAsOn = false;
      break;
    case Status.INDETERMINATE:
      statusColors = createBasesFromColor(statusToggleStatus.indeterminateBaseColor, "base01");
      statusText = statusToggleStatus.indeterminateText;
      statusActionColors = createBasesFromColor(statusToggleActions.turnOnBaseColor, "base01");
      statusActionText = statusToggleActions.turnOnText;
      countsAsOn = false;
      break;
    default:
      break;
  }
  return (
    <View style={[{
      // ...showBorder,
      alignSelf: "flex-end",
      marginBottom: styles.heightMargin,
      flexDirection: "row",
      justifyContent: "space-between",
      height: 50,
      width: styles.width * .6,
    }]}>
      <AwesomeButton
        key={key}
        accessibilityLabel={key}
        backgroundColor={statusColors.base01}
        backgroundActive={statusColors.base02}
        backgroundDarker={statusColors.base03}
        textColor={statusColors.base1}
        height={50}
        // textSize={12}
        disabled={true}
      >{` ${statusText} `}</AwesomeButton>
      <AwesomeButton
        key={`${key} toggle`}
        accessibilityLabel={key}
        backgroundColor={statusActionColors.base01}
        backgroundActive={statusActionColors.base02}
        backgroundDarker={statusActionColors.base03}
        textColor={statusActionColors.base1}
        height={50}
        onPress={() => toggleCallback(!countsAsOn, fieldName)}
        // textSize={12}
        disabled={false}
      >{` ${statusActionText} `}</AwesomeButton>
    </View>);
}

export function getMultiSelectRow(
  openMultiText: string,
  closeMultiText: string,
  fieldName: string,
  initiallySelectedItems: string[],
  allItems: Array<{ id: string, name: string }>,
  currentlyOpen: boolean,
  changeFieldCallback: (selectedItemId: string) => void,
  toggleCallback: () => void,
) {
  const styles = getStyles();
  const lightSelectButtons = allItems.map((lightMeta) => {
    return (<AwesomeButton
      style={{ marginBottom: 5 }}
      key={lightMeta.id}
      onPress={() => changeFieldCallback(lightMeta.id)}
      accessibilityLabel={lightMeta.name}
      backgroundColor={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base01 : styles.solarized.base01}
      backgroundActive={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base02 : styles.solarized.base02}
      backgroundDarker={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base03 : styles.solarized.base03}
      textColor={initiallySelectedItems.includes(lightMeta.id) ? styles.green.base1 : styles.solarized.base1}
      height={70}
      width={70}
      textSize={12}
      textLineHeight={15}
    >
      {`${lightMeta.name}`}
    </AwesomeButton>);
  });
  const multiSelect = (
    <View style={styles.multiSelect}>
      {lightSelectButtons}
    </View>);

  if (currentlyOpen) {
    return (
      <View style={[styles.multiSelectRow]}>
        {multiSelect}
        <AwesomeButton
          key={`${openMultiText} toggle`}
          accessibilityLabel={openMultiText}
          backgroundColor={currentlyOpen ? styles.solarized.base01 : styles.green.base01}
          backgroundActive={currentlyOpen ? styles.solarized.base02 : styles.green.base02}
          backgroundDarker={currentlyOpen ? styles.solarized.base03 : styles.green.base03}
          textColor={currentlyOpen ? styles.solarized.base1 : styles.green.base1}
          height={50}
          onPress={() => toggleCallback()}
          // textSize={12}
          disabled={false}
        >{` ${closeMultiText} `}</AwesomeButton>
      </View>
    );
  } else {
    return (
      <View style={[styles.multiSelectRow]}>
        <AwesomeButton
          key={`${openMultiText} toggle`}
          accessibilityLabel={openMultiText}
          backgroundColor={currentlyOpen ? styles.solarized.base01 : styles.green.base01}
          backgroundActive={currentlyOpen ? styles.solarized.base02 : styles.green.base02}
          backgroundDarker={currentlyOpen ? styles.solarized.base03 : styles.green.base03}
          textColor={currentlyOpen ? styles.solarized.base1 : styles.green.base1}
          height={50}
          onPress={() => toggleCallback()}
          // textSize={12}
          disabled={false}
        >{` ${openMultiText} `}</AwesomeButton>
      </View>
    );
  }
}

export function hueHsbToHsl(phillipsHue: number, phillipsSaturation: number, brightness: number) {
  // Phillips hue is 0 - 65535, hsl is looking for 0-360
  const hue = (phillipsHue / 65535) * 360;
  // Phillips saturation is 0 - 254, hsl is looking for 0-100%
  const saturation = (phillipsSaturation / 254);
  // Phillips brightness is 0 - 254, hsl is looking for 0-100%
  const lightness = (brightness / 254);
  const hslString = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  return hslString;
}

export function hslToHueHsb(hslString: string) {
  let cleanString = hslString.replace("hsl(", "");
  cleanString = cleanString.replace(")", "");
  let hslArray = cleanString.split(",");
  hslArray = hslArray.map((hsl) => hsl.trim());
  const hue = (parseFloat(hslArray[0]) / 360) * 65535;
  const sat = (parseFloat(hslArray[1])) * 254;
  const bri = (parseFloat(hslArray[2])) * 254;
  return { hue, sat, bri };
}
export function hueHsbToHsv(phillipsHue: number, phillipsSaturation: number, brightness: number) {
  // Phillips hue is 0 - 65535, hsl is looking for 0-360
  const hue = (phillipsHue / 65535) * 360;
  // Phillips saturation is 0 - 254, hsl is looking for 0-100%
  const saturation = (phillipsSaturation / 254);
  // Phillips brightness is 0 - 254, hsl is looking for 0-100%
  const value = (brightness / 254);
  const hsl = { h: hue, s: saturation, v: value };
  return hsl;
}

export function hsvToHueHsb(hsv: { h: number, s: number, v: number }) {
  const hue = (hsv.h / 360) * 65535;
  const sat = hsv.s * 254;
  const bri = hsv.v * 254;
  return { hue, sat, bri };
}

export function getColorPicker(
  hue: number,
  saturation: number,
  brightness: number,
  setHsb: (hsb: any) => void,
  id: string,
) {
  const styles = getStyles();

  return (
    <View style={{ flex: 1 }}>
      <ColorPicker
        color={(() => {
          const hsv = hueHsbToHsv(hue, saturation, brightness);
          return hsv;
        })() as any}
        defaultColor={null}
        onColorSelected={(color) => alert(`Color selected: ${color}`)}
        onColorChange={(color) => {
          const hsb = hsvToHueHsb(color);
          setHsb(hsvToHueHsb(color));
        }}
        style={{
          width: 350,
          height: 350,
        }}
      />
    </View>
  );
}
export function getColorPicker2(
  // hsb: any,
  hue: number,
  saturation: number,
  brightness: number,
  setHsb: (hsb: any) => void,
  id: string,
) {
  const styles = getStyles();
  return (
    <View style={{ flex: 1 }}>
      <ColorPicker2.default
        id={id}
        height={50}
        color={hueHsbToHsl(hue, saturation, brightness)}
        width={300}
        onColorChanged={(color) => {
          setHsb(hslToHueHsb(color));
        }}
      />
    </View >
  );
}
