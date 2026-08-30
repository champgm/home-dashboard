import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useAppRuntime } from "../AppContext";
import { Screen } from "../components/Screen";
import { EditorAction, EditorSection } from "../editors/editorControls";

export function HueReauthorizationScreen(): JSX.Element {
  const runtime = useAppRuntime();
  const [message, setMessage] = useState<string>();
  return <Screen showTitle={false} title="Hue Same-Bridge Reauthorization">
    <Text style={styles.body}>{runtime.binding ? "If the stored Hue credential is rejected, press the physical bridge link button and explicitly reauthorize this same bridge. A different bridge identity is refused." : "No protected Hue binding is present; use initial provisioning."}</Text>
    {runtime.binding && <EditorSection title="Recovery">
      <EditorAction label="Reauthorize after link-button press" onPress={async () => {
      const result = await runtime.reauthorizeHue();
      setMessage(result.kind === "success" ? "Same-bridge credential replaced." : result.diagnostic?.message || "Reauthorization did not complete.");
      }} testID="reauthorization-submit" />
    </EditorSection>}
    {message && <Text style={styles.message}>{message}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  body: { color: "#fdf6e3", lineHeight: 21, marginBottom: 12 },
  message: { color: "#b58900", lineHeight: 20, marginTop: 10 },
});
