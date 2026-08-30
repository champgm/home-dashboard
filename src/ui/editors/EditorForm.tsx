import React, { ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { CommandResult } from "../../app/types";
import { HueDeleteAction } from "../components/HueDeleteAction";
import { Screen } from "../components/Screen";
import { EditorAction, EditorSection, EditorSummaryRow } from "./editorControls";

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
  const currentValue = current?.state.status === "known" ? current.state.value as { state?: { on?: boolean; all_on?: boolean; any_on?: boolean }; on?: boolean; status?: string } : undefined;
  const existingResourceUnavailable = Boolean(id && (!current || current.state.status !== "known"));
  const [name, setName] = useState(initialName || currentName);
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);
  const liveState = currentValue ? currentStateLabel(currentValue) : undefined;
  const saveResource = async (): Promise<void> => {
    if (saving || existingResourceUnavailable) return;
    setSaving(true);
    try {
      const result = onSave
        ? await onSave(name)
        : id
          ? name === currentName
            ? { kind: "success" as const }
            : await runtime.service.mutateHue(kind, id, "update", { name })
          : await runtime.service.createHue(kind, { name });
      setMessage(result.kind === "success" ? "Saved and refreshed." : editorFailureMessage(result));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Not saved.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen showTitle={false} title={title}>
      <EditorSection title="Identity">
        <Text style={styles.label}>Name</Text>
        <TextInput editable={!existingResourceUnavailable} onChangeText={setName} placeholder="Resource name" placeholderTextColor="#93a1a1" style={[styles.input, existingResourceUnavailable && styles.disabled]} testID="editor-name" value={name} />
      </EditorSection>
      {note && <Text style={styles.note}>{note}</Text>}
      {existingResourceUnavailable && <Text accessibilityRole="alert" style={styles.warning} testID="editor-unknown-resource">The current Hue resource is Unknown or unavailable. Editing is disabled until a fresh bridge snapshot identifies it.</Text>}
      {!existingResourceUnavailable && id && (kind === "light" || kind === "group") && <EditorSection title="Live power">
        <EditorSummaryRow label="Current state" value={liveState || "Current state unavailable"} />
        <View style={styles.stateActions}>
          <EditorAction label="Turn on" onPress={() => void runLiveAction(runtime.service.setAbsolute({ kind, id }, true), setMessage, "On requested and refreshed.", "On request was not completed.")} testID="editor-live-on" />
          <EditorAction label="Turn off" onPress={() => void runLiveAction(runtime.service.setAbsolute({ kind, id }, false), setMessage, "Off requested and refreshed.", "Off request was not completed.")} testID="editor-live-off" />
        </View>
      </EditorSection>}
      {!existingResourceUnavailable && id && (kind === "rule" || kind === "schedule") && <EditorSection title="Live automation status">
        <EditorSummaryRow label="Current status" value={currentValue?.status ? capitalize(currentValue.status) : "Status unavailable"} />
        <View style={styles.stateActions}>
          <EditorAction label="Enable" onPress={() => void runLiveAction(runtime.service.mutateHue(kind, id, "status", { status: "enabled" }), setMessage, "Enabled and refreshed.", "Enable request was rejected or failed.")} testID="editor-live-enable" />
          <EditorAction label="Disable" onPress={() => void runLiveAction(runtime.service.mutateHue(kind, id, "status", { status: "disabled" }), setMessage, "Disabled and refreshed.", "Disable request was not completed.")} testID="editor-live-disable" />
        </View>
      </EditorSection>}
      {!existingResourceUnavailable && <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => void saveResource()} style={[styles.button, saving && styles.disabled]} testID="editor-save"><Text style={styles.buttonText}>{saving ? "Saving…" : saveLabel || (id ? "Save changed fields" : "Create resource")}</Text></Pressable>}
      {message && <Text style={styles.message}>{message}</Text>}
      {children}
      {!existingResourceUnavailable && id && <EditorSection title="Danger zone"><HueDeleteAction kind={kind} id={id} objectName={`${kind} ${id}`} navigation={navigation} /></EditorSection>}
    </Screen>
  );
}

async function runLiveAction(
  operation: Promise<CommandResult>,
  setMessage: (value: string) => void,
  successMessage: string,
  failureMessage: string,
): Promise<void> {
  try {
    const result = await operation;
    setMessage(result.kind === "success" ? successMessage : failureMessage);
  } catch (error) {
    setMessage(error instanceof Error ? error.message : failureMessage);
  }
}

function currentStateLabel(value: { state?: { on?: boolean; all_on?: boolean; any_on?: boolean }; on?: boolean }): string {
  if (typeof value.state?.on === "boolean") return value.state.on ? "On" : "Off";
  if (typeof value.on === "boolean") return value.on ? "On" : "Off";
  if (value.state?.all_on === true) return "All on";
  if (value.state?.any_on === false) return "All off";
  if (value.state?.any_on === true && value.state.all_on === false) return "Mixed / indeterminate";
  return "Current state unavailable";
}

function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }

function editorFailureMessage(result: CommandResult): string {
  const message = result.diagnostic?.message || "Not saved.";
  const detail = result.diagnostic?.detail;
  return detail && detail !== message ? `${message} ${detail}` : message;
}

const styles = StyleSheet.create({
  label: { color: "#fdf6e3", marginBottom: 5 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", marginBottom: 6, minHeight: 48, padding: 12 },
  note: { color: "#93a1a1", lineHeight: 19, marginBottom: 14 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, justifyContent: "center", marginBottom: 4, marginTop: 6, minHeight: 48, paddingHorizontal: 18, paddingVertical: 10 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
  warning: { color: "#dc322f", marginBottom: 12 },
  stateActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  disabled: { opacity: 0.55 },
});
