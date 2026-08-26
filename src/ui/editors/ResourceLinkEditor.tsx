import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useAppRuntime } from "../AppContext";
import { HueDeleteAction } from "../components/HueDeleteAction";
import { EditorChoice, EditorAction, EditorSection, EditorTextField, ReadOnlyField } from "./editorControls";
import { Screen } from "../components/Screen";

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
  const unknownLinks = links.filter((link) => !/^\/(lights|groups|scenes|sensors|rules|schedules)\/\d+$/i.test(link.replace(/^\/api\/[^/]+/i, "")));
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
  return <Screen title="Resource Link Editor">
    <EditorSection title="Resource Link metadata">
      <EditorTextField disabled={!editable} label="Class" onChangeText={setResourceClass} placeholder="HomeDashboard" testID="resourcelink-class" value={resourceClass} />
      <EditorTextField disabled={!editable} label="Description" onChangeText={setDescription} placeholder="Description" testID="resourcelink-description" value={description} />
      {!editable && <ReadOnlyField label="Editing" value="Disabled until a fresh bridge snapshot identifies this Resource Link." />}
    </EditorSection>
    <EditorSection title="Managed resource references">
      {editable && <>
        <EditorChoice label="Resource kind" onChange={(kind) => setLinkKind(kind as LinkKind)} options={["light", "group", "scene", "sensor", "rule", "schedule"]} testID="resourcelink-kind" value={linkKind} />
        <EditorTextField label="Resource ID" onChangeText={setLinkId} placeholder="1" testID="resourcelink-id" value={linkId} />
        <EditorAction label="Add resource reference" onPress={() => { if (/^\d+$/.test(linkId.trim())) { setLinks((current) => current.includes(`/${linkKind}s/${linkId.trim()}`) ? current : [...current, `/${linkKind}s/${linkId.trim()}`]); setLinksChanged(true); setLinkId(""); } }} testID="resourcelink-add" />
      </>}
      {links.filter((link) => !unknownLinks.includes(link)).map((link) => editable
        ? <Pressable accessibilityRole="button" key={link} onPress={() => { setLinks((current) => current.filter((item) => item !== link)); setLinksChanged(true); }} style={styles.linkRow}><Text style={styles.linkText}>{link}</Text><Text style={styles.remove}>Remove</Text></Pressable>
        : <ReadOnlyField key={link} label="Existing reference" value={link} />)}
      {unknownLinks.map((link) => <ReadOnlyField key={`unknown-${link}`} label="Existing unsupported reference" value={link} />)}
    </EditorSection>
    {editable && <Pressable onPress={() => void save()} style={styles.save} testID="resourcelink-save"><Text style={styles.saveText}>{id ? "Save changed fields" : "Create Resource Link"}</Text></Pressable>}
    {id && <HueDeleteAction kind="resourcelink" id={id} objectName={`Resource Link ${id}`} navigation={navigation} />}
    {message && <Text style={styles.message}>{message}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  save: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, marginTop: 14, padding: 12 },
  saveText: { color: "#fff", fontWeight: "700" },
  linkRow: { alignItems: "center", borderBottomColor: "#586e75", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  linkText: { color: "#fdf6e3" },
  remove: { color: "#dc322f", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
});
