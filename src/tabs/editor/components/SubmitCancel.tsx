
import React from "react";
import { View, ViewStyle } from "react-native";
import AwesomeButton from "react-native-really-awesome-button";
import { RgbBaseStringMap } from "solarizer/tsc-out/RgbMaps";
import { getStyles } from "../../common/Style";

export function getSubmitCancel(
  submitLabel: string,
  cancelLabel: string,
  submitCallback: () => void,
  cancelCallback: () => void,
) {
  const styles = getStyles();

  return (
    <View style={{
      // ...styles.showBorder,
      flexShrink: 1,
      marginBottom: styles.heightMargin,
      flexDirection: "row",
      justifyContent: "space-around",
      paddingBottom: 20,
    }}>
      <AwesomeButton
        key={cancelLabel}
        accessibilityLabel={cancelLabel}
        backgroundColor={styles.red.base01}
        backgroundActive={styles.red.base02}
        backgroundDarker={styles.red.base03}
        textColor={styles.red.base1}
        height={50}
        onPress={() => cancelCallback()}
      >{` ${cancelLabel} `}</AwesomeButton>
      <AwesomeButton
        key={submitLabel}
        accessibilityLabel={submitLabel}
        backgroundColor={styles.green.base01}
        backgroundActive={styles.green.base02}
        backgroundDarker={styles.green.base03}
        textColor={styles.green.base1}
        height={50}
        onPress={() => submitCallback()}
      >{` ${submitLabel} `}</AwesomeButton>
    </View >);
}
