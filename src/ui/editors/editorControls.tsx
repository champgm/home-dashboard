import React from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

export function EditorSection({ title, children }: { readonly title: string; readonly children: React.ReactNode }): JSX.Element {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

export function EditorTextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  disabled = false,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly multiline?: boolean;
  readonly disabled?: boolean;
  readonly testID?: string;
}): JSX.Element {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!disabled}
      multiline={multiline}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#93a1a1"
      style={[styles.input, multiline && styles.multiline]}
      testID={testID || `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      value={value}
    />
  </View>;
}

export function EditorNumberField({
  label,
  value,
  onChange,
  placeholder,
  testID,
}: {
  readonly label: string;
  readonly value: number | undefined;
  readonly onChange: (value: number | undefined) => void;
  readonly placeholder?: string;
  readonly testID?: string;
}): JSX.Element {
  return <EditorTextField
    label={label}
    onChangeText={(next) => onChange(next.trim() === "" ? undefined : Number(next))}
    placeholder={placeholder}
    testID={testID}
    value={value === undefined ? "" : String(value)}
  />;
}

export function EditorToggle({
  label,
  value,
  onValueChange,
  disabled = false,
  testID,
}: {
  readonly label: string;
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}): JSX.Element {
  return <View style={styles.toggleRow} testID={testID}>
    <Text style={styles.label}>{label}</Text>
    <Switch accessibilityLabel={label} disabled={disabled} onValueChange={onValueChange} value={value} />
  </View>;
}

export function ReadOnlyField({ label, value }: { readonly label: string; readonly value: unknown }): JSX.Element {
  const rendered = value === undefined || value === null || value === "" ? "Unavailable" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return <View style={styles.readOnly}>
    <Text style={styles.readOnlyLabel}>{label}</Text>
    <Text accessibilityLabel={`${label}: ${rendered}`} style={styles.readOnlyValue}>{rendered}</Text>
  </View>;
}

export function EditorChoice({
  label,
  value,
  options,
  onChange,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
  readonly testID?: string;
}): JSX.Element {
  return <View style={styles.field} testID={testID}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.choiceRow}>
      {options.map((option) => <Pressable accessibilityRole="button" accessibilityState={{ selected: option === value }} key={option} onPress={() => onChange(option)} style={[styles.choice, option === value && styles.choiceSelected]}><Text style={styles.choiceText}>{option}</Text></Pressable>)}
    </View>
  </View>;
}

export function EditorAction({ label, onPress, testID }: { readonly label: string; readonly onPress: () => void; readonly testID?: string }): JSX.Element {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action} testID={testID}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  section: { borderTopColor: "#586e75", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 12 },
  sectionTitle: { color: "#b58900", fontSize: 17, fontWeight: "700", marginBottom: 8 },
  field: { marginBottom: 10 },
  label: { color: "#fdf6e3", marginBottom: 5 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", padding: 11 },
  multiline: { minHeight: 78, textAlignVertical: "top" },
  toggleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  readOnly: { marginBottom: 8 },
  readOnlyLabel: { color: "#93a1a1", fontSize: 12 },
  readOnlyValue: { color: "#fdf6e3", marginTop: 2 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  choice: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 7, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  choiceSelected: { backgroundColor: "#268bd2", borderColor: "#268bd2" },
  choiceText: { color: "#fdf6e3", fontSize: 12 },
  action: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, marginTop: 8, padding: 12 },
  actionText: { color: "#fff", fontWeight: "700" },
});

export const editorStyles = styles;
