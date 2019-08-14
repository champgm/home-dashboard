
import React from "react";
import { View, ViewStyle } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import { getStyles } from "../common/Style";

export interface TabLike {
  label: string;
  selected: boolean;
  toggleCallback: () => void;
  selectedColors: RgbBaseStringMap;
  deSelectedColors: RgbBaseStringMap;
}

export function getTabLike(tabs: TabLike[]) {

  const styles = getStyles();
  const tabJsx = [];
  for (let index = 0; index < tabs.length; index++) {
    const tab = tabs[index];
    tabJsx.push(<AwesomeButton
      key={tab.label}
      accessibilityLabel={tab.label}
      backgroundColor={tab.selected ? tab.selectedColors.base01 : tab.deSelectedColors.base01}
      backgroundActive={tab.selected ? tab.selectedColors.base02 : tab.deSelectedColors.base02}
      backgroundDarker={tab.selected ? tab.selectedColors.base03 : tab.deSelectedColors.base03}
      textColor={tab.selected ? tab.selectedColors.base1 : tab.deSelectedColors.base1}
      height={50}
      onPress={() => tab.toggleCallback()}
      disabled={false}
    >{` ${tab.label} `}</AwesomeButton>);
  };

  return (

    <View style={{
      // ...styles.showBorder,
      flexShrink: 1,
      marginBottom: styles.heightMargin,
      flexDirection: "row",
      justifyContent: "space-around",
    }}>
      {tabJsx}
    </View >);
}
