import React from "react";
import * as ColorPicker2 from "react-colorizer";
import { View } from "react-native";
import { ColorPicker } from "react-native-color-picker";
import { getStyles } from "../../common/Style";

export function hueHsbToHsl(hsb: { h: number, s: number, b: number }) {
  // Phillips hue is 0 - 65535, hsl is looking for 0-360
  const hue = (hsb.h / 65535) * 360;
  // Phillips saturation is 0 - 254, hsl is looking for 0-100%
  const saturation = (hsb.s / 254) * 100;
  // Phillips hsb.b is 0 - 254, hsl is looking for 0-100%
  const lightness = (hsb.b / 254) * 100;
  const hslString = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  console.log(`setting HSL string: ${hslString}`);
  return hslString;
}

export function hslToHueHsb(hslString: string) {
  console.log(`HSL string: ${hslString}`);
  let cleanString = hslString.replace("hsl(", "");
  cleanString = cleanString.replace(")", "");
  cleanString = cleanString.replace("%", "");
  let hslArray = cleanString.split(",");
  hslArray = hslArray.map((hsl) => hsl.trim());
  console.log(`HSL array: ${JSON.stringify(hslArray)}`);
  const h = Math.round((parseFloat(hslArray[0]) / 360) * 65535);
  const s = Math.round((parseFloat(hslArray[1]) / 100) * 254);
  const b = Math.round((parseFloat(hslArray[2]) / 100) * 254);
  const hsb = { h, s, b };
  console.log(`Calculated HSB: ${JSON.stringify(hsb)}`);
  return hsb;
}

export function getColorPicker2(
  hsb: {
    h: number,
    s: number,
    b: number,
  },
  setHsb: (hsb: any) => void,
  id: string,
) {
  const styles = getStyles();
  return (
    <View style={{
      alignSelf: "center",
      flexGrow: 1,
    }}>
      <ColorPicker2.default
        id={id}
        height={50}
        color={hueHsbToHsl(hsb)}
        width={300}
        onColorChanged={(color) => {
          setHsb(hslToHueHsb(color));
        }}
      />
    </View >
  );
}
// export function hueHsbToHsv(hsb: { h: number, s: number, b: number }) {
//   // Phillips hue is 0 - 65535, hsl is looking for 0-360
//   const hue = (hsb.h / 65535) * 360;
//   // Phillips saturation is 0 - 254, hsl is looking for 0-100%
//   const saturation = (hsb.s / 254);
//   // Phillips hsb.b is 0 - 254, hsl is looking for 0-100%
//   const value = (hsb.b / 254);
//   const hsl = { h: hue, s: saturation, v: value };
//   return hsl;
// }

// export function hsvToHueHsb(hsv: { h: number, s: number, v: number }) {
//   const hue = (hsv.h / 360) * 65535;
//   const sat = hsv.s * 254;
//   const bri = hsv.v * 254;
//   return { hue, sat, bri };
// }

// export function getColorPicker(
//   hue: number,
//   saturation: number,
//   hsb.b: number,
//   setHsb: (hsb: any) => void,
//   id: string,
// ) {
//   const styles = getStyles();
//   return (
//     <View style={{ flex: 1 }}>
//       <ColorPicker
//         color={(() => {
//           const hsv = hueHsbToHsv(hue, saturation, hsb.b);
//           return hsv;
//         })() as any}
//         defaultColor={null}
//         onColorSelected={(color) => alert(`Color selected: ${color}`)}
//         onColorChange={(color) => {
//           const hsb = hsvToHueHsb(color);
//           setHsb(hsvToHueHsb(color));
//         }}
//         style={{
//           width: 350,
//           height: 350,
//         }}
//       />
//     </View>
//   );
// }
