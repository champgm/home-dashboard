import React from "react";
import { View } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { getStyles } from "../common/Style";

export function getLightSelector(
  initiallySelectedItems: string[],
  allItems: Array<{ id: string, name: string }>,
  toggleLightSelection: (itemId: string) => void,
) {
  const styles = getStyles();
  const lightSelectButtons = allItems.map((lightMeta) => {
    return (<AwesomeButton
      style={{ marginBottom: 5 }}
      key={lightMeta.id}
      onPress={() => toggleLightSelection(lightMeta.id)}
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
  return (
    <View style={{
      // ...styles.showBorder,
      // alignSelf:"stretch",
      flexGrow:1,
      // flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-around",
    }}>
      {lightSelectButtons}
    </View>
  );
}
