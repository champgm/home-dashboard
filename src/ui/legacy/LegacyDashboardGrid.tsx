import React, { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

export function LegacyDashboardGrid({ children, testID }: PropsWithChildren<{ readonly testID?: string }>): JSX.Element {
  return <View testID={testID} style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    alignItems: "flex-start",
    backgroundColor: "#002b36",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
  },
});
