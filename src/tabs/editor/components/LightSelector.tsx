import React from "react";
import { View } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { sortBy } from "../../../common";
import { getStyles } from "../../common/Style";

export function getLightSelector(
  initiallySelectedItems: string[],
  items: Array<{ id: string, name: string }>,
  toggleLightSelection: (itemId: string) => void,
) {
  const styles = getStyles();
  const sortedItems = sortBy(items, "name");
  const lightSelectButtons = sortedItems.map((lightMeta) => {
    return (<AwesomeButton
      style={{ marginBottom: 5 }}
      key={lightMeta.id}
      onPress={() => toggleLightSelection(lightMeta.id)}
      accessibilityLabel={lightMeta.name}
      backgroundColor={initiallySelectedItems.includes(lightMeta.id) ? styles.blue.base01 : styles.solarized.base01}
      backgroundActive={initiallySelectedItems.includes(lightMeta.id) ? styles.blue.base02 : styles.solarized.base02}
      backgroundDarker={initiallySelectedItems.includes(lightMeta.id) ? styles.blue.base03 : styles.solarized.base03}
      textColor={initiallySelectedItems.includes(lightMeta.id) ? styles.blue.base1 : styles.solarized.base1}
      width={80}
      textSize={12}
    >
      {`${lightMeta.name}`}
    </AwesomeButton>);
  });
  return (
    <View style={{
      flexGrow:1,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    }}>
      {lightSelectButtons}
    </View>
  );
}
