import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useAppRuntime } from "../AppContext";
import { HueDeleteAction } from "../components/HueDeleteAction";
import { EditorChoice, EditorAction, EditorChoiceOption, EditorResourceSelector, EditorSection, EditorTextField, ReadOnlyField } from "./editorControls";
import { Screen } from "../components/Screen";
import { ExpandableAdvancedSection } from "../components/ExpandableAdvancedSection";

type LinkKind = "light" | "group" | "scene" | "sensor" | "rule" | "schedule";

export function ResourceLinkEditor({ route, navigation }: { route?: any; navigation?: any }): JSX.Element {
  const runtime = useAppRuntime();
  const id = route?.params?.id as string | undefined;
  const stored = id ? runtime.service.stateStore.get({ kind: "resourcelink", id }) : undefined;
  const value = stored?.state.status === "known" ? stored.state.value as { class?: string; description?: string; links?: string[] } : undefined;
  const editable = !id || stored?.state.status === "known";
  const [resourceClass, setResourceClass] = useState(value?.class || "HomeDashboard");
  const [description, setDescription] = useState(value?.description || "");
  const [links, setLinks] = useState(value?.links || []);
  const [linksChanged, setLinksChanged] = useState(false);
  const [linkKind, setLinkKind] = useState<LinkKind>("light");
  const [linkId, setLinkId] = useState("");
  const [message, setMessage] = useState<string>();
  const unknownLinks = links.filter((link) => !/^\/(lights|groups|scenes|sensors|rules|schedules)\/[^/?#]+$/i.test(link.replace(/^\/api\/[^/]+/i, "")));
  const resourceOptions = resourceOptionsFor(runtime.service.stateStore, linkKind, linkId);
  const save = async () => {
    if (!editable) {
      setMessage("The current Resource Link is Unknown or unavailable. Refresh before editing it.");
      return;
    }
    if (linksChanged && unknownLinks.length > 0) {
      setMessage("This Resource Link contains an unsupported existing reference. Leave links unchanged or remove it explicitly from the bridge administration workflow.");
      return;
    }
    const payload = { class: resourceClass, description, ...(linksChanged || unknownLinks.length === 0 ? { links } : {}) };
    const result = id ? await runtime.service.mutateHue("resourcelink", id, "update", payload) : await runtime.service.createHue("resourcelink", { ...payload, links });
    setMessage(result.kind === "success" ? "Resource Link saved and refreshed." : result.diagnostic?.message || "Resource Link was not saved.");
  };
  const addReference = (): void => {
    const trimmedId = linkId.trim();
    if (!/^[^/?#]+$/.test(trimmedId)) {
      setMessage("Choose a resource or enter a valid resource ID.");
      return;
    }
    const path = `/${linkKind}s/${encodeURIComponent(trimmedId)}`;
    setLinks((current) => current.includes(path) ? current : [...current, path]);
    setLinksChanged(true);
    setLinkId("");
    setMessage(undefined);
  };
  return <Screen showTitle={false} title="Resource Link Editor">
    <EditorSection title="Resource Link">
      <EditorTextField disabled={!editable} label="Class" onChangeText={setResourceClass} placeholder="HomeDashboard" testID="resourcelink-class" value={resourceClass} />
      <EditorTextField disabled={!editable} label="Description" onChangeText={setDescription} placeholder="Description" testID="resourcelink-description" value={description} />
      {!editable && <ReadOnlyField label="Editing" value="Disabled until a fresh bridge snapshot identifies this Resource Link." />}
    </EditorSection>
    {editable && <EditorAction label={id ? "Save changed fields" : "Create Resource Link"} onPress={() => void save()} testID="resourcelink-save" />}
    <EditorSection title="Linked resources">
      {editable && <>
        <EditorChoice defaultExpanded={false} label="Resource kind" onChange={(kind) => { setLinkKind(kind as LinkKind); setLinkId(""); }} options={["light", "group", "scene", "sensor", "rule", "schedule"]} presentation="list" testID="resourcelink-kind" value={linkKind} />
        <EditorResourceSelector label="Resource" onChange={setLinkId} options={resourceOptions} testID="resourcelink-resource" value={linkId} />
        <EditorTextField keyboardType={linkKind === "scene" ? "default" : "numeric"} label="Exact resource ID" onChangeText={setLinkId} placeholder="1" testID="resourcelink-id" value={linkId} />
        <EditorAction label="Add resource reference" onPress={addReference} testID="resourcelink-add" />
      </>}
      {links.filter((link) => !unknownLinks.includes(link)).map((link) => editable
        ? <Pressable accessibilityLabel={`Remove ${resourceLabel(runtime.service.stateStore, link)}`} accessibilityRole="button" key={link} onPress={() => { setLinks((current) => current.filter((item) => item !== link)); setLinksChanged(true); }} style={styles.linkRow}><Text style={styles.linkText}>{resourceLabel(runtime.service.stateStore, link)}</Text><Text style={styles.remove}>Remove</Text></Pressable>
        : <ReadOnlyField key={link} label="Existing reference" value={resourceLabel(runtime.service.stateStore, link)} />)}
      {unknownLinks.length > 0 && <ReadOnlyField label="Unsupported existing references" value={`${unknownLinks.length} reference${unknownLinks.length === 1 ? "" : "s"} retained read-only`} />}
    </EditorSection>
    <ExpandableAdvancedSection summary="Exact Hue paths and unsupported references" testID="resourcelink-advanced">
      {links.filter((link) => !unknownLinks.includes(link)).map((link) => <ReadOnlyField key={`exact-${link}`} label="Exact link path" value={link} />)}
      {unknownLinks.map((link) => <ReadOnlyField key={`unknown-${link}`} label="Unsupported exact link path" value={link} />)}
    </ExpandableAdvancedSection>
    {editable && id && <HueDeleteAction kind="resourcelink" id={id} objectName={`Resource Link ${id}`} navigation={navigation} />}
    {message && <Text style={styles.message}>{message}</Text>}
  </Screen>;
}

function resourceOptionsFor(stateStore: { getAll: () => ReadonlyMap<string, { readonly state: { readonly status: string; readonly value?: unknown } }> }, kind: LinkKind, selectedId: string): readonly EditorChoiceOption[] {
  const prefix = `${kind}:`;
  const options: EditorChoiceOption[] = [];
  stateStore.getAll().forEach((stored, key) => {
    if (!key.startsWith(prefix) || stored.state.status !== "known") return;
    const id = key.slice(prefix.length);
    const value = stored.state.value;
    const name = value && typeof value === "object" && typeof (value as { name?: unknown }).name === "string"
      ? String((value as { name: string }).name).trim()
      : `${capitalize(kind)} ${id}`;
    options.push({ value: id, label: `${name || capitalize(kind)} (ID ${id})` });
  });
  if (selectedId.trim() && !options.some((option) => option.value === selectedId.trim())) options.push({ value: selectedId.trim(), label: `${capitalize(kind)} unavailable (ID ${selectedId.trim()})` });
  return options.sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true }));
}

function resourceLabel(stateStore: { get: (ref: { kind: LinkKind; id: string }) => { readonly state: { readonly status: string; readonly value?: unknown } } | undefined }, link: string): string {
  const match = link.replace(/^\/api\/[^/]+/i, "").match(/^\/(lights|groups|scenes|sensors|rules|schedules)\/([^/?#]+)$/i);
  if (!match) return link;
  const kind = singularKind(match[1].toLowerCase());
  const id = safeDecode(match[2]);
  const stored = stateStore.get({ kind, id });
  if (stored?.state.status === "known" && stored.state.value && typeof stored.state.value === "object") {
    const name = (stored.state.value as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return `${name.trim()} (${capitalize(kind)} ${id})`;
  }
  return `${capitalize(kind)} ${id} (label unavailable)`;
}

function singularKind(value: string): LinkKind {
  return value.endsWith("s") ? value.slice(0, -1) as LinkKind : value as LinkKind;
}
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}
function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({
  linkRow: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingVertical: 7 },
  linkText: { color: "#fdf6e3" },
  remove: { color: "#dc322f", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
});
