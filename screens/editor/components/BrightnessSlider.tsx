
import React from "react";
import Slider from '@react-native-community/slider';
import { RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import { getStyles } from "../../../common/Style";

export function getBrightnessSlider(
  currentValue: number,
  valueChanged: (newValue: number, overrideDebounce: boolean) => void,
  colorMap: RgbBaseStringMap,
) {
  const styles = getStyles();
  return (
    <Slider
      style={{
        paddingTop: 30,
        paddingBottom: 40,
        alignSelf: "center",
        width: 300,
        height: 40,
      }}
      // step={0}
      value={currentValue}
      onValueChange={(newValue) => valueChanged(Math.floor(newValue), false)}
      onSlidingComplete={(newValue) => valueChanged(Math.floor(newValue), true)}
      minimumValue={0}
      maximumValue={254}
      // thumbImage={require("../../../assets/lightBulb.png")}
      // trackImage={require("../../../assets/lightBulb.png")}
      maximumTrackTintColor={colorMap.base1}
      minimumTrackTintColor={styles.solarized.blue}
      thumbTintColor={styles.solarized.blue}
    />
  );
}