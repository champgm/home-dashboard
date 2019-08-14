import React from "react";
import * as ColorPicker2 from "react-colorizer";
import { View } from "react-native";
import { ColorPicker, } from "react-native-color-picker";
import { getStyles } from "../common/Style";


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
  hue: number,
  saturation: number,
  brightness: number,
  setHsb: (hsb: any) => void,
  id: string,
) {
  const styles = getStyles();
  return (
    <View style={{
      alignSelf: "center",
      flexGrow: 1
    }}>
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
