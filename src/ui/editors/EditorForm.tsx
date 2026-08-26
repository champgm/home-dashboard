import React, { ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { CommandResult } from "../../app/types";
import { HueDeleteAction } from "../components/HueDeleteAction";
import { Screen } from "../components/Screen";

export interface EditorFormProps {
  readonly title: string;
  readonly kind: "light" | "group" | "scene" | "sensor" | "rule" | "schedule" | "resourcelink";
  readonly id?: string;
  readonly initialName?: string;
  readonly navigation?: any;
  readonly note?: string;
  readonly onSave?: (name: string) => Promise<CommandResult>;
  readonly saveLabel?: string;
  readonly children?: ReactNode;
}

export function EditorForm({ title, kind, id, initialName, navigation, note, onSave, saveLabel, children }: EditorFormProps): JSX.Element {
  const runtime = useAppRuntime();
  const current = id ? runtime.service.stateStore.get({ kind, id }) : undefined;
  const currentName = current?.state.status === "known" ? String((current.state.value as { name?: unknown }).name || "") : "";
  const currentValue = current?.state.status === "known" ? current.state.value as { state?: { on?: boolean }; on?: boolean; status?: string } : undefined;
  const existingResourceUnavailable = Boolean(id && (!current || current.state.status !== "known"));
  const [name, setName] = useState(initialName || currentName);
  const [message, setMessage] = useState<string>();
  return (
    <Screen title={title}>
      <Text style={styles.label}>Name</Text>
      <TextInput editable={!existingResourceUnavailable} onChangeText={setName} placeholder="Resource name" placeholderTextColor="#93a1a1" style={styles.input} value={name} />
      {note && <Text style={styles.note}>{note}</Text>}
      {existingResourceUnavailable && <Text accessibilityRole="alert" style={styles.warning} testID="editor-unknown-resource">The current Hue resource is Unknown or unavailable. Editing is disabled until a fresh bridge snapshot identifies it.</Text>}
      {!existingResourceUnavailable && id && (kind === "light" || kind === "group") && <View style={styles.stateActions}>
        <Text style={styles.sectionLabel}>Explicit absolute state</Text>
        <Pressable onPress={async () => setMessage((await runtime.service.setAbsolute({ kind, id }, true)).kind === "success" ? "On requested and refreshed." : "On request was not completed.")} style={styles.secondary}><Text style={styles.secondaryText}>On</Text></Pressable>
        <Pressable onPress={async () => setMessage((await runtime.service.setAbsolute({ kind, id }, false)).kind === "success" ? "Off requested and refreshed." : "Off request was not completed.")} style={styles.secondary}><Text style={styles.secondaryText}>Off</Text></Pressable>
        {currentValue && <Text style={styles.current}>{typeof currentValue.state?.on === "boolean" ? (currentValue.state.on ? "Currently On" : "Currently Off") : typeof currentValue.on === "boolean" ? (currentValue.on ? "Currently On" : "Currently Off") : "Current state unavailable"}</Text>}
      </View>}
      {!existingResourceUnavailable && id && (kind === "rule" || kind === "schedule") && <View style={styles.stateActions}>
        <Text style={styles.sectionLabel}>Automation status</Text>
        <Pressable onPress={async () => setMessage((await runtime.service.mutateHue(kind, id, "status", { status: "enabled" })).kind === "success" ? "Enabled and refreshed." : "Enable request was rejected or failed.")} style={styles.secondary}><Text style={styles.secondaryText}>Enable</Text></Pressable>
        <Pressable onPress={async () => setMessage((await runtime.service.mutateHue(kind, id, "status", { status: "disabled" })).kind === "success" ? "Disabled and refreshed." : "Disable request was not completed.")} style={styles.secondary}><Text style={styles.secondaryText}>Disable</Text></Pressable>
        {currentValue?.status && <Text style={styles.current}>Currently {currentValue.status}</Text>}
      </View>}
      {!existingResourceUnavailable && <Pressable onPress={async () => {
          const result = onSave
            ? await onSave(name)
            : id
              ? name === currentName
                ? { kind: "success" as const }
                : await runtime.service.mutateHue(kind, id, "update", { name })
              : await runtime.service.createHue(kind, { name });
          setMessage(result.kind === "success" ? "Saved and refreshed." : result.diagnostic?.message || "Not saved.");
        }} style={styles.button} testID="editor-save"><Text style={styles.buttonText}>{saveLabel || (id ? "Save changed fields" : "Create resource")}</Text></Pressable>}
      {!existingResourceUnavailable && id && <HueDeleteAction kind={kind} id={id} objectName={`${kind} ${id}`} navigation={navigation} />}
      {children}
      {message && <Text style={styles.message}>{message}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: "#fdf6e3", marginBottom: 5 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", marginBottom: 12, padding: 12 },
  note: { color: "#93a1a1", lineHeight: 19, marginBottom: 14 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
  warning: { color: "#dc322f", marginBottom: 12 },
  stateActions: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  sectionLabel: { color: "#fdf6e3", marginRight: 10, paddingVertical: 10, width: "100%" },
  secondary: { backgroundColor: "#586e75", borderRadius: 8, marginRight: 8, paddingHorizontal: 18, paddingVertical: 10 },
  secondaryText: { color: "#fdf6e3", fontWeight: "700" },
  current: { color: "#93a1a1", paddingVertical: 10 },
});
