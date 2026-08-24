import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { DestructiveActionSpec } from "../../app/destructiveActions";

export interface ConfirmDestructiveActionProps {
  readonly spec?: DestructiveActionSpec;
  readonly visible: boolean;
  readonly onCancel: () => void;
  readonly onConfirmed?: () => void;
}

export function ConfirmDestructiveAction({ spec, visible, onCancel, onConfirmed }: ConfirmDestructiveActionProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!visible && submitting) setSubmitting(false); }, [submitting, visible]);
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View accessibilityRole="alert" style={styles.dialog}>
          <Text style={styles.title}>Confirm {spec?.objectType || "destructive action"}</Text>
          <Text style={styles.body}>{spec ? `${spec.objectName}: ${spec.consequence}` : "This action cannot be undone."}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityLabel="Cancel" accessibilityRole="button" onPress={onCancel} style={styles.cancel}><Text>Cancel</Text></Pressable>
            <Pressable
              accessibilityLabel="Confirm"
              accessibilityRole="button"
              disabled={submitting}
              onPress={async () => {
                if (submitting) return;
                setSubmitting(true);
                try {
                  if (spec) await spec.action();
                  onConfirmed?.();
                } finally {
                  setSubmitting(false);
                }
              }}
              style={[styles.confirm, submitting && styles.confirmDisabled]}
            ><Text style={styles.confirmText}>{submitting ? "Working…" : "Confirm"}</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.68)", flex: 1, justifyContent: "center", padding: 24 },
  dialog: { backgroundColor: "#fdf6e3", borderRadius: 14, maxWidth: 420, padding: 20, width: "100%" },
  title: { color: "#073642", fontSize: 19, fontWeight: "700", marginBottom: 10 },
  body: { color: "#073642", fontSize: 15, marginBottom: 20 },
  actions: { borderTopColor: "#93a1a1", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "flex-end", paddingTop: 16 },
  cancel: { borderRadius: 8, marginRight: 12, padding: 12 },
  confirm: { backgroundColor: "#dc322f", borderRadius: 8, padding: 12 },
  confirmText: { color: "#fff", fontWeight: "700" },
  confirmDisabled: { opacity: 0.55 },
});
