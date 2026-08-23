import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
export function SceneEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const [message, setMessage] = useState<string>();
  return <EditorForm title="Scene Editor" kind="scene" id={id} navigation={navigation} note="GroupScene activation uses its stored group; LightScene activation uses group 0. Per-light state is edited explicitly.">
    {id && <>
      <Pressable onPress={async () => setMessage((await runtime.service.performPrimary({ kind: "scene", id })).kind === "success" ? "Scene activated and refreshed." : "Scene activation was not completed.")} style={styles.button}><Text style={styles.buttonText}>Activate scene</Text></Pressable>
      {message && <Text style={styles.message}>{message}</Text>}
    </>}
  </EditorForm>;
}

const styles = StyleSheet.create({
  button: { alignSelf: "flex-start", backgroundColor: "#586e75", borderRadius: 8, marginTop: 8, padding: 12 },
  buttonText: { color: "#fdf6e3", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 8 },
});
