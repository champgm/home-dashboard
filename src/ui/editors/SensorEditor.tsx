import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
export function SensorEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const [message, setMessage] = useState<string>();
  return <EditorForm title="Sensor Editor" kind="sensor" id={id} navigation={navigation} note="Read-only sensor capability fields are not presented as writable controls.">
    {id && <>
      <Pressable onPress={async () => setMessage((await runtime.service.setAbsolute({ kind: "sensor", id }, true)).kind === "success" ? "Sensor enabled." : "Sensor enable was not completed.")} style={styles.button}><Text style={styles.buttonText}>Set enabled</Text></Pressable>
      <Pressable onPress={async () => setMessage((await runtime.service.setAbsolute({ kind: "sensor", id }, false)).kind === "success" ? "Sensor disabled." : "Sensor disable was not completed")} style={styles.button}><Text style={styles.buttonText}>Set disabled</Text></Pressable>
      {message && <Text style={styles.message}>{message}</Text>}
    </>}
  </EditorForm>;
}

const styles = StyleSheet.create({
  button: { alignSelf: "flex-start", backgroundColor: "#586e75", borderRadius: 8, marginTop: 8, padding: 12 },
  buttonText: { color: "#fdf6e3", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 8 },
});
