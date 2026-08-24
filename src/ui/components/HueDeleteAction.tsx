import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { ResourceKind } from "../../app/types";
import { destructiveActionSpec, performConfirmedHueDelete } from "../../app/destructiveActions";
import { useAppRuntime } from "../AppContext";
import { ConfirmDestructiveAction } from "./ConfirmDestructiveAction";

export interface HueDeleteActionProps {
  readonly kind: Exclude<ResourceKind, "plug">;
  readonly id: string;
  readonly objectName: string;
  readonly navigation?: any;
}

export function HueDeleteAction({ kind, id, objectName, navigation }: HueDeleteActionProps): JSX.Element {
  const runtime = useAppRuntime();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>();
  const deleteAction = async () => {
    const result = await performConfirmedHueDelete(
      runtime.service,
      runtime.configStore,
      kind,
      id,
      () => runtime.service.deleteHue(kind, id),
    );
    if (result.kind === "success") {
      navigation?.goBack?.();
    } else {
      setMessage(result.diagnostic?.message || "The resource was not deleted.");
    }
    return result;
  };
  return <>
    <Pressable
      accessibilityLabel={`Delete ${objectName}`}
      accessibilityRole="button"
      onPress={() => { setMessage(undefined); setVisible(true); }}
      style={styles.delete}
      testID="editor-delete"
    ><Text style={styles.deleteText}>Delete</Text></Pressable>
    {message && <Text style={styles.message}>{message}</Text>}
    <ConfirmDestructiveAction
      visible={visible}
      onCancel={() => setVisible(false)}
      onConfirmed={() => setVisible(false)}
      spec={destructiveActionSpec(
        objectName,
        "Hue resource",
        "delete it from the bridge and remove its matching local Favorite when possible",
        deleteAction,
      )}
    />
  </>;
}

const styles = StyleSheet.create({
  delete: { alignSelf: "flex-start", backgroundColor: "#dc322f", borderRadius: 8, marginTop: 12, padding: 12 },
  deleteText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
});
