// Why is this Necessary...
import React from "react";
import * as ColorPicker2 from "react-colorizer";
import { Switch, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { ColorPicker, TriangleColorPicker } from "react-native-color-picker";
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

export function getMultiSelectRow(
  label: string,
  initiallySelectedItems: string[],
  allItems: Array<{ id: string, name: string }>,
  changeFieldCallback: (selectedItemId: string) => void,
  disabled: boolean = false,
  applyPadding: boolean = true,
) {
  const styles = getStyles();
  console.log(`${allItems.length} items to display`);
  const lightSelectButtons = allItems.map((lightMeta) => {
    return (<AwesomeButton
      style={applyPadding ? { marginBottom: 10 } : {}}
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

export function hueHsbToHsl(phillipsHue: number, phillipsSaturation: number, brightness: number) {
  console.log(`Phillips values: ${JSON.stringify({ phillipsHue, phillipsSaturation, brightness }, null, 2)}`);
  // Phillips hue is 0 - 65535, hsl is looking for 0-360
  const hue = (phillipsHue / 65535) * 360;
  // Phillips saturation is 0 - 254, hsl is looking for 0-100%
  const saturation = (phillipsSaturation / 254);
  // Phillips brightness is 0 - 254, hsl is looking for 0-100%
  const lightness = (brightness / 254);
  const hslString = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  console.log(`Calculated HSL string: ${hslString}`);
  return hslString;
}

export function hslToHueHsb(hslString: string) {
  console.log(`HSL string: ${hslString}`);
  let cleanString = hslString.replace("hsl(", "");
  cleanString = cleanString.replace(")", "");
  let hslArray = cleanString.split(",");
  hslArray = hslArray.map((hsl) => hsl.trim());
  const hue = (parseFloat(hslArray[0]) / 360) * 65535;
  const sat = (parseFloat(hslArray[1])) * 254;
  const bri = (parseFloat(hslArray[2])) * 254;
  console.log(`calculated phillips HSL: ${JSON.stringify({ hue, sat, bri }, null, 2)}`);
  return { hue, sat, bri };
}
export function hueHsbToHsv(phillipsHue: number, phillipsSaturation: number, brightness: number) {
  // console.log(`Phillips values: ${JSON.stringify({ phillipsHue, phillipsSaturation, brightness }, null, 2)}`);
  // Phillips hue is 0 - 65535, hsl is looking for 0-360
  const hue = (phillipsHue / 65535) * 360;
  // Phillips saturation is 0 - 254, hsl is looking for 0-100%
  const saturation = (phillipsSaturation / 254);
  // Phillips brightness is 0 - 254, hsl is looking for 0-100%
  const value = (brightness / 254);
  const hsl = { h: hue, s: saturation, v: value };
  // console.log(`Calculated HSL: ${JSON.stringify(hsl)}`);
  return hsl;
}

export function hsvToHueHsb(hsv: { h: number, s: number, v: number }) {
  // console.log(`HSV: ${JSON.stringify(hsv)}`);
  const hue = (hsv.h / 360) * 65535;
  const sat = hsv.s * 254;
  const bri = hsv.v * 254;
  // console.log(`calculated phillips HSL: ${JSON.stringify({ hue, sat, bri })}`);
  return { hue, sat, bri };
}

export function getColorPicker(
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
      <ColorPicker
        color={(() => {
          console.log(`Instantiating: ${JSON.stringify({ hue, saturation, brightness })}`);
          const hsv = hueHsbToHsv(hue, saturation, brightness);
          console.log(`Instantiated HSV: ${JSON.stringify(hsv)}`);
          const hsb = hsvToHueHsb(hsv);
          console.log(`Instantiated back to HSB: ${JSON.stringify(hsb)}`);
          return hsv;
        })() as any}
        defaultColor={null}
        onColorSelected={(color) => alert(`Color selected: ${color}`)}
        onColorChange={(color) => {
          console.log(`color changed ${JSON.stringify(color)}`);
          const hsb = hsvToHueHsb(color);
          console.log(`Color to HSB: ${JSON.stringify(hsb)}`);
          console.log(`Color back to HSV: ${JSON.stringify(hueHsbToHsv(hsb.hue, hsb.sat, hsb.bri))}`);
          setHsb(hsvToHueHsb(color));
        }}
        style={{
          width: 350,
          height: 350,
          // ...styles.showBorder,
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
