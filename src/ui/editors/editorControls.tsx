import React from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";

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

export function EditorRangeField({
  label,
  value,
  onChange,
  minimumValue,
  maximumValue,
  step = 1,
  displayScale = 1,
  unit,
  testID,
}: {
  readonly label: string;
  readonly value: number | undefined;
  readonly onChange: (value: number | undefined) => void;
  readonly minimumValue: number;
  readonly maximumValue: number;
  readonly step?: number;
  readonly displayScale?: number;
  readonly unit?: string;
  readonly testID?: string;
}): JSX.Element {
  const sliderValue = Math.min(maximumValue, Math.max(minimumValue, value ?? minimumValue));
  const renderedValue = value === undefined ? "Not set" : `${formatRangeNumber(value * displayScale)}${unit ? ` ${unit}` : ""}`;
  return <View style={styles.field}>
    <Text style={styles.label}>{label}: {renderedValue}</Text>
    <Slider
      accessibilityLabel={`${label} slider`}
      maximumTrackTintColor="#586e75"
      maximumValue={maximumValue}
      minimumTrackTintColor="#6c71c4"
      minimumValue={minimumValue}
      onValueChange={(next) => onChange(next)}
      step={step}
      testID={testID ? `${testID}-slider` : undefined}
      thumbTintColor="#fdf6e3"
      value={sliderValue}
    />
    <TextInput
      accessibilityLabel={`${label} exact value`}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="decimal-pad"
      onChangeText={(next) => {
        if (next.trim() === "") return onChange(undefined);
        const parsed = Number(next);
        onChange(Number.isFinite(parsed) ? parsed / displayScale : undefined);
      }}
      style={[styles.input, styles.rangeInput]}
      testID={testID}
      value={value === undefined ? "" : formatRangeNumber(value * displayScale)}
    />
  </View>;
}

export function EditorCatalogNumberField({ fieldKey, label, value, onChange, testID }: { readonly fieldKey: string; readonly label: string; readonly value: number | undefined; readonly onChange: (value: number | undefined) => void; readonly testID?: string }): JSX.Element {
  if (fieldKey === "bri") return <EditorRangeField label={label} maximumValue={254} minimumValue={1} onChange={onChange} testID={testID} value={value} />;
  if (fieldKey === "sat") return <EditorRangeField label={label} maximumValue={254} minimumValue={0} onChange={onChange} testID={testID} value={value} />;
  if (fieldKey === "ct") return <EditorRangeField label={`${label} (warm–cool)`} maximumValue={500} minimumValue={153} onChange={onChange} testID={testID} value={value} />;
  if (fieldKey === "transitiontime") return <EditorRangeField displayScale={0.1} label={label} maximumValue={600} minimumValue={0} onChange={onChange} step={1} testID={testID} unit="seconds" value={value} />;
  if (fieldKey === "sunriseoffset" || fieldKey === "sunsetoffset") return <EditorRangeField label={label} maximumValue={120} minimumValue={-120} onChange={onChange} testID={testID} unit="minutes" value={value} />;
  if (fieldKey === "duration") return <EditorRangeField label={label} maximumValue={3600} minimumValue={0} onChange={onChange} testID={testID} unit="seconds" value={value} />;
  return <EditorNumberField label={label} onChange={onChange} testID={testID} value={value} />;
}

const HUE_SWATCHES = [
  ["Red", 0, "#dc322f"], ["Orange", 7000, "#cb4b16"], ["Yellow", 12750, "#b58900"],
  ["Green", 25500, "#2aa198"], ["Cyan", 32768, "#2aa198"], ["Blue", 43690, "#268bd2"],
  ["Violet", 50000, "#6c71c4"], ["Magenta", 56100, "#d33682"],
] as const;

export function EditorHueField({ label, value, onChange, testID }: { readonly label: string; readonly value: number | undefined; readonly onChange: (value: number | undefined) => void; readonly testID?: string }): JSX.Element {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View accessibilityLabel={`${label} picker`} style={styles.swatchRow}>
      {HUE_SWATCHES.map(([name, hue, color]) => <Pressable accessibilityLabel={`${label}: ${name}`} accessibilityRole="button" key={name} onPress={() => onChange(hue)} style={[styles.colorSwatch, { backgroundColor: color }, value === hue && styles.colorSwatchSelected]} testID={testID ? `${testID}-${name.toLowerCase()}` : undefined} />)}
    </View>
    <EditorNumberField label={`${label} exact Hue value (0–65535)`} onChange={onChange} testID={testID} value={value} />
  </View>;
}

const XY_SWATCHES = [
  ["Red", "0.675,0.322", "#dc322f"], ["Orange", "0.6,0.36", "#cb4b16"], ["Yellow", "0.45,0.48", "#b58900"],
  ["Green", "0.17,0.7", "#859900"], ["Cyan", "0.16,0.34", "#2aa198"], ["Blue", "0.15,0.06", "#268bd2"],
  ["Violet", "0.3,0.12", "#6c71c4"], ["White", "0.3227,0.329", "#fdf6e3"],
] as const;

export function EditorXyColorField({ label, value, onChangeText, testID }: { readonly label: string; readonly value: string; readonly onChangeText: (value: string) => void; readonly testID?: string }): JSX.Element {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View accessibilityLabel={`${label} picker`} style={styles.swatchRow}>
      {XY_SWATCHES.map(([name, xy, color]) => <Pressable accessibilityLabel={`${label}: ${name}`} accessibilityRole="button" key={name} onPress={() => onChangeText(xy)} style={[styles.colorSwatch, { backgroundColor: color }, value === xy && styles.colorSwatchSelected]} testID={testID ? `${testID}-${name.toLowerCase()}` : undefined} />)}
    </View>
    <EditorTextField label={`${label} exact CIE x,y`} onChangeText={onChangeText} placeholder="0.5,0.5" testID={testID} value={value} />
  </View>;
}

function formatRangeNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
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
  rangeInput: { marginTop: 4 },
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
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  colorSwatch: { borderColor: "#93a1a1", borderRadius: 18, borderWidth: 1, height: 36, width: 36 },
  colorSwatchSelected: { borderColor: "#fdf6e3", borderWidth: 3 },
});

export const editorStyles = styles;
