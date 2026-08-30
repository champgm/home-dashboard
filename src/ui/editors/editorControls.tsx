import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";

export function EditorSection({ title, children }: { readonly title: string; readonly children: React.ReactNode }): JSX.Element {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

/**
 * A compact value row used for summaries and deliberate secondary actions.
 * Keeping this primitive local to the editor area avoids changing the legacy
 * dashboard tile geometry while giving detail screens a predictable touch
 * target.
 */
export function EditorSummaryRow({
  label,
  value,
  onPress,
  disabled = false,
  expanded,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly expanded?: boolean;
  readonly testID?: string;
}): JSX.Element {
  const content = <>
    <View style={styles.summaryCopy}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
    {onPress && <Text style={styles.summaryChevron}>{expanded ? "▾" : "›"}</Text>}
  </>;
  if (!onPress) return <View style={styles.summaryRow} testID={testID}>{content}</View>;
  return <Pressable
    accessibilityLabel={`${label}: ${value}`}
    accessibilityRole="button"
    accessibilityState={{ disabled, ...(expanded === undefined ? {} : { expanded }) }}
    disabled={disabled}
    onPress={onPress}
    style={[styles.summaryRow, disabled && styles.disabled]}
    testID={testID}
  >{content}</Pressable>;
}

export function EditorTextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  disabled = false,
  testID,
  keyboardType,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly multiline?: boolean;
  readonly disabled?: boolean;
  readonly testID?: string;
  readonly keyboardType?: "default" | "numeric" | "decimal-pad";
}): JSX.Element {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!disabled}
      keyboardType={keyboardType}
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
  showExact = true,
}: {
  readonly label: string;
  readonly value: number | undefined;
  readonly onChange: (value: number | undefined) => void;
  readonly placeholder?: string;
  readonly testID?: string;
  readonly showExact?: boolean;
}): JSX.Element {
  const [exactVisible, setExactVisible] = React.useState(showExact);
  const onChangeText = (next: string): void => onChange(next.trim() === "" ? undefined : Number(next));
  if (showExact) return <EditorTextField
      label={label}
      keyboardType="decimal-pad"
      onChangeText={onChangeText}
      placeholder={placeholder}
      testID={testID}
      value={value === undefined ? "" : String(value)}
    />;
  return <View style={styles.field} testID={testID}>
    <Text style={styles.label}>{label}: {value === undefined ? "Not set" : String(value)}</Text>
    {!exactVisible && <Pressable
      accessibilityRole="button"
      onPress={() => setExactVisible(true)}
      style={styles.secondaryLink}
      testID={testID ? `${testID}-exact-toggle` : undefined}
    ><Text style={styles.secondaryLinkText}>Enter exact value</Text></Pressable>}
    {exactVisible && <EditorTextField
      label={`${label} exact value`}
      keyboardType="decimal-pad"
      onChangeText={onChangeText}
      placeholder={placeholder}
      testID={testID ? `${testID}-exact` : undefined}
      value={value === undefined ? "" : String(value)}
    />}
  </View>;
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
  showExact = true,
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
  /** Keep the exact protocol entry on demand on migrated screens. */
  readonly showExact?: boolean;
}): JSX.Element {
  const [exactVisible, setExactVisible] = React.useState(showExact);
  const sliderValue = Math.min(maximumValue, Math.max(minimumValue, value ?? minimumValue));
  const renderedValue = value === undefined ? "Not set" : `${formatRangeNumber(value * displayScale)}${unit ? ` ${unit}` : ""}`;
  return <View style={styles.field} testID={!showExact ? testID : undefined}>
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
    {!exactVisible && <Pressable
      accessibilityRole="button"
      onPress={() => setExactVisible(true)}
      style={styles.secondaryLink}
      testID={testID ? `${testID}-exact-toggle` : undefined}
    ><Text style={styles.secondaryLinkText}>Enter exact value</Text></Pressable>}
    {exactVisible && <TextInput
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
        testID={showExact ? testID : testID ? `${testID}-exact` : undefined}
        value={value === undefined ? "" : formatRangeNumber(value * displayScale)}
      />}
  </View>;
}

export function EditorCatalogNumberField({ fieldKey, label, value, onChange, testID, showExact = true }: { readonly fieldKey: string; readonly label: string; readonly value: number | undefined; readonly onChange: (value: number | undefined) => void; readonly testID?: string; readonly showExact?: boolean }): JSX.Element {
  if (fieldKey === "bri") return <EditorRangeField label={label} maximumValue={254} minimumValue={1} onChange={onChange} showExact={showExact} testID={testID} value={value} />;
  if (fieldKey === "sat") return <EditorRangeField label={label} maximumValue={254} minimumValue={0} onChange={onChange} showExact={showExact} testID={testID} value={value} />;
  if (fieldKey === "ct") return <EditorRangeField label={`${label} (warm–cool)`} maximumValue={500} minimumValue={153} onChange={onChange} showExact={showExact} testID={testID} value={value} />;
  if (fieldKey === "transitiontime") return <EditorRangeField displayScale={0.1} label={label} maximumValue={600} minimumValue={0} onChange={onChange} showExact={showExact} step={1} testID={testID} unit="seconds" value={value} />;
  if (fieldKey === "sunriseoffset" || fieldKey === "sunsetoffset") return <EditorRangeField label={label} maximumValue={120} minimumValue={-120} onChange={onChange} showExact={showExact} testID={testID} unit="minutes" value={value} />;
  if (fieldKey === "duration") return <EditorRangeField label={label} maximumValue={3600} minimumValue={0} onChange={onChange} showExact={showExact} testID={testID} unit="seconds" value={value} />;
  if (fieldKey === "bri_inc") return <EditorRangeField label={label} maximumValue={254} minimumValue={-254} onChange={onChange} showExact={showExact} testID={testID} value={value} />;
  return <EditorNumberField label={label} onChange={onChange} showExact={showExact} testID={testID} value={value} />;
}

const HUE_SWATCHES = [
  ["Red", 0, "#dc322f"], ["Orange", 7000, "#cb4b16"], ["Yellow", 12750, "#b58900"],
  ["Green", 25500, "#2aa198"], ["Cyan", 32768, "#2aa198"], ["Blue", 43690, "#268bd2"],
  ["Violet", 50000, "#6c71c4"], ["Magenta", 56100, "#d33682"],
] as const;

export function EditorHueField({ label, value, onChange, testID, showExact = true }: { readonly label: string; readonly value: number | undefined; readonly onChange: (value: number | undefined) => void; readonly testID?: string; readonly showExact?: boolean }): JSX.Element {
  const [exactVisible, setExactVisible] = React.useState(showExact);
  return <View style={styles.field} testID={!showExact ? testID : undefined}>
    <Text style={styles.label}>{label}</Text>
    <View accessibilityLabel={`${label} picker`} style={styles.swatchRow}>
      {HUE_SWATCHES.map(([name, hue, color]) => <Pressable accessibilityLabel={`${label}: ${name}`} accessibilityRole="button" key={name} onPress={() => onChange(hue)} style={[styles.colorSwatch, { backgroundColor: color }, value === hue && styles.colorSwatchSelected]} testID={testID ? `${testID}-${name.toLowerCase()}` : undefined} />)}
    </View>
    {!exactVisible && <Pressable accessibilityRole="button" onPress={() => setExactVisible(true)} style={styles.secondaryLink} testID={testID ? `${testID}-exact-toggle` : undefined}><Text style={styles.secondaryLinkText}>Enter exact Hue value</Text></Pressable>}
    {exactVisible && <EditorNumberField label={`${label} exact Hue value (0–65535)`} onChange={onChange} testID={showExact ? testID : testID ? `${testID}-exact` : undefined} value={value} />}
  </View>;
}

const XY_SWATCHES = [
  ["Red", "0.675,0.322", "#dc322f"], ["Orange", "0.6,0.36", "#cb4b16"], ["Yellow", "0.45,0.48", "#b58900"],
  ["Green", "0.17,0.7", "#859900"], ["Cyan", "0.16,0.34", "#2aa198"], ["Blue", "0.15,0.06", "#268bd2"],
  ["Violet", "0.3,0.12", "#6c71c4"], ["White", "0.3227,0.329", "#fdf6e3"],
] as const;

export function EditorXyColorField({ label, value, onChangeText, testID, showExact = true }: { readonly label: string; readonly value: string; readonly onChangeText: (value: string) => void; readonly testID?: string; readonly showExact?: boolean }): JSX.Element {
  const [exactVisible, setExactVisible] = React.useState(showExact);
  return <View style={styles.field} testID={!showExact ? testID : undefined}>
    <Text style={styles.label}>{label}</Text>
    <View accessibilityLabel={`${label} picker`} style={styles.swatchRow}>
      {XY_SWATCHES.map(([name, xy, color]) => <Pressable accessibilityLabel={`${label}: ${name}`} accessibilityRole="button" key={name} onPress={() => onChangeText(xy)} style={[styles.colorSwatch, { backgroundColor: color }, value === xy && styles.colorSwatchSelected]} testID={testID ? `${testID}-${name.toLowerCase()}` : undefined} />)}
    </View>
    {!exactVisible && <Pressable accessibilityRole="button" onPress={() => setExactVisible(true)} style={styles.secondaryLink} testID={testID ? `${testID}-exact-toggle` : undefined}><Text style={styles.secondaryLinkText}>Enter exact x,y value</Text></Pressable>}
    {exactVisible && <EditorTextField label={`${label} exact CIE x,y`} onChangeText={onChangeText} placeholder="0.5,0.5" testID={showExact ? testID : testID ? `${testID}-exact` : undefined} value={value} />}
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
  return <View style={[styles.toggleRow, disabled && styles.disabled]} testID={testID}>
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
  presentation,
  defaultExpanded,
  quickOptions,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly onChange: (value: string) => void;
  readonly testID?: string;
  readonly presentation?: "segmented" | "list";
  readonly defaultExpanded?: boolean;
  readonly quickOptions?: readonly string[];
}): JSX.Element {
  const isList = presentation === "list" || (presentation === undefined && options.length > 4);
  const [expanded, setExpanded] = React.useState(defaultExpanded ?? false);
  if (!isList) return <View style={styles.field} testID={testID}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.choiceRow}>
      {options.map((option) => <Pressable accessibilityLabel={`${label}: ${option}`} accessibilityRole="button" accessibilityState={{ selected: option === value }} key={option} onPress={() => onChange(option)} style={[styles.choice, option === value && styles.choiceSelected]} testID={testID ? `${testID}-${slug(option)}` : undefined}><Text style={styles.choiceText}>{option}</Text></Pressable>)}
    </View>
  </View>;
  const quick = uniqueStrings(quickOptions || []);
  return <View style={styles.field} testID={testID}>
    <Text style={styles.label}>{label}</Text>
    <Pressable
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((current) => !current)}
      style={styles.selectorTrigger}
      testID={testID ? `${testID}-selector` : undefined}
    ><Text style={styles.selectorValue} numberOfLines={2}>{value || "Choose a value"}</Text><Text style={styles.summaryChevron}>{expanded ? "▾" : "›"}</Text></Pressable>
    {quick.length > 0 && <View style={styles.quickChoiceRow}>
      {quick.map((option) => <Pressable accessibilityLabel={`${label}: ${option}`} accessibilityRole="button" accessibilityState={{ selected: option === value }} key={`quick-${option}`} onPress={() => onChange(option)} style={[styles.choice, option === value && styles.choiceSelected]} testID={testID ? `${testID}-${slug(option)}` : undefined}><Text style={styles.choiceText}>{option}</Text></Pressable>)}
    </View>}
    {expanded && <ScrollView nestedScrollEnabled style={styles.optionList} testID={testID ? `${testID}-options` : undefined}>
      {options.map((option) => <Pressable accessibilityLabel={`${label}: ${option}`} accessibilityRole="button" accessibilityState={{ selected: option === value }} key={option} onPress={() => onChange(option)} style={[styles.optionRow, option === value && styles.optionRowSelected]} testID={testID ? `${testID}-option-${slug(option)}` : undefined}><Text style={styles.optionText}>{option}</Text>{option === value && <Text style={styles.optionCheck}>✓</Text>}</Pressable>)}
    </ScrollView>}
  </View>;
}

export interface EditorChoiceOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Friendly presentation for an exact resource identity. The callback always
 * receives the stored value, never the display label, so duplicate names do
 * not change the protocol path being edited.
 */
export function EditorResourceSelector({
  label,
  value,
  options,
  onChange,
  testID,
  defaultExpanded = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly EditorChoiceOption[];
  readonly onChange: (value: string) => void;
  readonly testID?: string;
  readonly defaultExpanded?: boolean;
}): JSX.Element {
  const current = options.find((option) => option.value === value);
  const selectedLabel = current?.label || (value ? `Unavailable (ID ${value})` : "Choose a resource");
  return <EditorChoice
    defaultExpanded={defaultExpanded}
    label={label}
    onChange={(next) => {
      const option = options.find((candidate) => candidate.label === next);
      if (option) onChange(option.value);
    }}
    options={options.map((option) => option.label)}
    presentation="list"
    testID={testID}
    value={selectedLabel}
  />;
}

export function EditorMultiChoice({
  label,
  values,
  options,
  onChange,
  testID,
  defaultExpanded = false,
}: {
  readonly label: string;
  readonly values: readonly string[];
  readonly options: readonly EditorChoiceOption[];
  readonly onChange: (values: readonly string[]) => void;
  readonly testID?: string;
  readonly defaultExpanded?: boolean;
}): JSX.Element {
  const selected = new Set(values);
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  return <View style={styles.field} testID={testID}>
    <Text style={styles.label}>{label}</Text>
    <Pressable accessibilityLabel={`${label}: ${values.length} selected`} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((current) => !current)} style={styles.selectorTrigger} testID={testID ? `${testID}-selector` : undefined}>
      <Text style={styles.selectorValue}>{values.length === 0 ? "None selected" : `${values.length} selected`}</Text><Text style={styles.summaryChevron}>{expanded ? "▾" : "›"}</Text>
    </Pressable>
    {options.length === 0
      ? <Text style={styles.emptyChoice}>No current lights are available.</Text>
      : expanded && <ScrollView nestedScrollEnabled style={styles.optionList} testID={testID ? `${testID}-options` : undefined}>
        {options.map((option) => {
          const isSelected = selected.has(option.value);
          return <Pressable
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => onChange(isSelected ? values.filter((value) => value !== option.value) : [...values, option.value])}
            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            testID={testID ? `${testID}-${option.value}` : undefined}
          ><Text style={styles.optionText}>{option.label}</Text>{isSelected && <Text style={styles.optionCheck}>✓</Text>}</Pressable>;
        })}
      </ScrollView>}
  </View>;
}

export function EditorAction({ label, onPress, testID }: { readonly label: string; readonly onPress: () => void; readonly testID?: string }): JSX.Element {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action} testID={testID}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return values.filter((value, index) => value.trim() !== "" && values.indexOf(value) === index);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const styles = StyleSheet.create({
  section: { borderTopColor: "#586e75", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 10 },
  sectionTitle: { color: "#b58900", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  field: { marginBottom: 10 },
  label: { color: "#fdf6e3", marginBottom: 4 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", minHeight: 48, padding: 11 },
  rangeInput: { marginTop: 4 },
  multiline: { minHeight: 78, textAlignVertical: "top" },
  toggleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 6, minHeight: 48 },
  readOnly: { marginBottom: 8 },
  readOnlyLabel: { color: "#93a1a1", fontSize: 12 },
  readOnlyValue: { color: "#fdf6e3", marginTop: 2 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  quickChoiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  choice: { alignItems: "center", backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 7, borderWidth: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  choiceSelected: { backgroundColor: "#268bd2", borderColor: "#268bd2" },
  choiceText: { color: "#fdf6e3", fontSize: 12 },
  emptyChoice: { color: "#93a1a1", fontSize: 12 },
  action: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, justifyContent: "center", marginTop: 6, minHeight: 48, paddingHorizontal: 16, paddingVertical: 10 },
  actionText: { color: "#fff", fontWeight: "700" },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  colorSwatch: { borderColor: "#93a1a1", borderRadius: 24, borderWidth: 1, height: 44, width: 44 },
  colorSwatchSelected: { borderColor: "#fdf6e3", borderWidth: 3 },
  summaryRow: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flex: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingVertical: 7 },
  summaryCopy: { flex: 1, paddingRight: 10 },
  summaryLabel: { color: "#93a1a1", fontSize: 12 },
  summaryValue: { color: "#fdf6e3", marginTop: 2 },
  summaryChevron: { color: "#b58900", fontSize: 23, lineHeight: 26, paddingHorizontal: 5 },
  selectorTrigger: { alignItems: "center", backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  selectorValue: { color: "#fdf6e3", flex: 1, paddingRight: 8 },
  optionList: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, marginTop: 6, maxHeight: 244 },
  optionRow: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  optionRowSelected: { backgroundColor: "#15566a" },
  optionText: { color: "#fdf6e3", flex: 1 },
  optionCheck: { color: "#b58900", fontSize: 18, fontWeight: "700", paddingLeft: 8 },
  secondaryLink: { alignSelf: "flex-start", justifyContent: "center", minHeight: 40, paddingVertical: 8 },
  secondaryLinkText: { color: "#268bd2", fontWeight: "700" },
  disabled: { opacity: 0.55 },
});

export const editorStyles = styles;
