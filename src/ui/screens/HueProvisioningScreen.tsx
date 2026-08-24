import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { validatePrivateIpv4 } from "../../config/endpointValidation";
import { useAppRuntime } from "../AppContext";
import { Screen } from "../components/Screen";

export function HueProvisioningScreen(): JSX.Element {
  const runtime = useAppRuntime();
  const [ipv4, setIpv4] = useState(runtime.configStore.getCommitted()?.bridge.ipv4 || "");
  const [message, setMessage] = useState<string>();
  const [diagnostic, setDiagnostic] = useState<ReturnType<typeof runtime.service.getDiagnostic>>();
  const [showDetail, setShowDetail] = useState(false);
  useEffect(() => runtime.configStore.subscribe(() => setIpv4(runtime.configStore.getCommitted()?.bridge.ipv4 || "")), [runtime]);
  const available = runtime.readiness === "HueBindingAbsent" || runtime.readiness === "HueUnconfigured";
  return <Screen title="Hue Initial Provisioning">
    <Text style={styles.body}>{available ? "Configure the bridge address, press the physical Hue link button, then start provisioning. The app is permanently bound only after the credential and bridge identity are stored together." : "Initial provisioning is unavailable after a protected Hue binding exists. Same-bridge reauthorization is the supported recovery path."}</Text>
    {available && <>
      <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="numeric" onChangeText={setIpv4} placeholder="192.168.x.x" placeholderTextColor="#93a1a1" style={styles.input} value={ipv4} />
      <Pressable onPress={async () => {
        const validation = validatePrivateIpv4(ipv4);
        if (!validation.valid) { setMessage(validation.error?.message); return; }
        const result = await runtime.provisionHue(validation.value!);
        setDiagnostic(result.diagnostic);
        setShowDetail(false);
        setMessage(result.kind === "success" ? "Hue is provisioned and permanently bound to this bridge." : result.diagnostic?.message || "Provisioning did not complete.");
      }} style={styles.button}><Text style={styles.buttonText}>Provision after link-button press</Text></Pressable>
    </>}
    {message && <Text style={styles.message}>{message}</Text>}
    {diagnostic && <View style={styles.diagnostic}>
      <Text style={styles.diagnosticTitle}>{diagnostic.category}</Text>
      {diagnostic.operation && <Text style={styles.detail}>Operation: {diagnostic.operation}</Text>}
      {diagnostic.resource && <Text style={styles.detail}>Endpoint: {diagnostic.resource}</Text>}
      {diagnostic.protocolCode !== undefined && <Text style={styles.detail}>Hue code: {diagnostic.protocolCode}</Text>}
      {diagnostic.statusCode !== undefined && <Text style={styles.detail}>HTTP status: {diagnostic.statusCode}</Text>}
      {diagnostic.elapsedMs !== undefined && <Text style={styles.detail}>Elapsed: {diagnostic.elapsedMs} ms</Text>}
      {diagnostic.detail && <Pressable onPress={() => setShowDetail((value) => !value)}><Text style={styles.detailToggle}>{showDetail ? "Hide technical detail" : "Show technical detail"}</Text></Pressable>}
      {showDetail && diagnostic.detail && <Text selectable style={styles.detail}>{diagnostic.detail}</Text>}
    </View>}
  </Screen>;
}

const styles = StyleSheet.create({
  body: { color: "#fdf6e3", lineHeight: 21, marginBottom: 12 },
  input: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, color: "#fdf6e3", marginBottom: 10, padding: 12 },
  button: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, padding: 12 },
  buttonText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", lineHeight: 20, marginTop: 10 },
  diagnostic: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 8, borderWidth: 1, marginTop: 12, padding: 12 },
  diagnosticTitle: { color: "#cb4b16", fontWeight: "700", marginBottom: 4 },
  detail: { color: "#93a1a1", fontSize: 12, marginTop: 3 },
  detailToggle: { color: "#268bd2", fontWeight: "700", marginTop: 8 },
});
