
import React from "react";
import { Slider } from "react-native";
import { RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import { getStyles } from "../../common/Style";

export function getBrightnessSlider(
  initialValue: number,
  valueChanged: (newValue: number, overrideDebounce: boolean) => void,
  colorMap: RgbBaseStringMap,
) {
  const styles = getStyles();
  return (
    <Slider
      style={{
        paddingTop:30,
        paddingBottom:40,
        alignSelf: "center",
        width: 300,
        height: 40,
      }}
      value={initialValue}
      onValueChange={(newValue) => valueChanged(newValue, false)}
      onSlidingComplete={(newValue) => valueChanged(newValue, true)}
      minimumValue={0}
      maximumValue={254}
      thumbImage={require("../../../../assets/lightBulb.png")}
      trackImage={require("../../../../assets/lightBulb.png")}
      maximumTrackTintColor={colorMap.base1}
      minimumTrackTintColor={styles.solarized.blue}
      thumbTintColor={styles.solarized.blue}
    />
  );
}
