import React, { ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function ExpandableAdvancedSection({
  children,
  summary,
  title = "Advanced",
  testID = "advanced-section",
  defaultExpanded = false,
}: {
  readonly children: ReactNode;
  readonly summary?: string;
  readonly title?: string;
  readonly testID?: string;
  readonly defaultExpanded?: boolean;
}): JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return <View style={styles.container} testID={testID}>
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((value) => !value)}
      style={styles.toggle}
      testID={`${testID}-toggle`}
    >
      <Text style={styles.title}>{expanded ? "▾" : "▸"} {title}</Text>
      {summary && <Text style={styles.summary}>{summary}</Text>}
    </Pressable>
    {expanded && <View style={styles.content} testID={`${testID}-content`}>{children}</View>}
  </View>;
}

const styles = StyleSheet.create({
  container: { borderTopColor: "#586e75", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 18, paddingTop: 10 },
  toggle: { justifyContent: "center", minHeight: 48, paddingVertical: 8 },
  title: { color: "#b58900", fontSize: 17, fontWeight: "700" },
  summary: { color: "#93a1a1", marginTop: 4 },
  content: { paddingTop: 8 },
});
