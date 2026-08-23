import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { EditorForm } from "./EditorForm";
import { useAppRuntime } from "../AppContext";
export function ScheduleEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const [message, setMessage] = useState<string>();
  return <EditorForm title="Schedule Editor" kind="schedule" id={id} navigation={navigation} note="Unchanged command authorization is omitted on ordinary saves. Rebuild command authorization is an explicit recovery action and never displays the credential.">
    {id && <>
      <Pressable onPress={async () => {
        const result = await runtime.service.rebuildScheduleCommand(id);
        setMessage(result.kind === "success" ? "Command authorization rebuilt and saved." : result.diagnostic?.message || "Command authorization was not rebuilt.");
      }} style={styles.rebuild}><Text style={styles.rebuildText}>Rebuild command authorization</Text></Pressable>
      {message && <Text style={styles.message}>{message}</Text>}
    </>}
  </EditorForm>;
}

const styles = StyleSheet.create({
  rebuild: { alignSelf: "flex-start", backgroundColor: "#586e75", borderRadius: 8, marginTop: 10, padding: 12 },
  rebuildText: { color: "#fdf6e3", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 8 },
});
