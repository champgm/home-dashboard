import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CommandResult } from "../../app/types";
import { destructiveActionSpec } from "../../app/destructiveActions";
import { success } from "../../app/commandResults";
import { ConfirmDestructiveAction } from "./ConfirmDestructiveAction";
import { DimmerChangeSet, DimmerChangeOperation, StructuralCommitReport } from "../../protocol/hue/dimmer";

export interface DimmerStructuralChangePreviewProps {
  readonly changeSet: DimmerChangeSet;
  readonly onCommit: () => Promise<StructuralCommitReport | CommandResult>;
  readonly onCommitted?: (result: StructuralCommitReport | CommandResult) => void;
}

/**
 * Review and confirmation boundary for a characterized multi-resource edit.
 * The component deliberately receives one concrete change set; it does not
 * inspect the bridge, calculate dependencies, or retain an operation journal.
 */
export function DimmerStructuralChangePreview({ changeSet, onCommit, onCommitted }: DimmerStructuralChangePreviewProps): JSX.Element {
  const [structuralVisible, setStructuralVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [message, setMessage] = useState<string>();
  const [report, setReport] = useState<StructuralCommitReport>();
  const deletes = useMemo(() => changeSet.operations.filter((operation) => operation.operation === "delete"), [changeSet.operations]);

  const commit = async (): Promise<void> => {
    setMessage(undefined);
    setReport(undefined);
    const result = await onCommit();
    onCommitted?.(result);
    if (isStructuralCommitReport(result)) setReport(result);
    if (result.kind === "success") {
      setMessage("Structural change applied and refreshed.");
    } else {
      setMessage(result.diagnostic?.message || "Structural change stopped; state was refreshed.");
    }
  };

  const confirmStructural = async (): Promise<CommandResult> => success();
  const confirmDelete = async (): Promise<CommandResult> => {
    await commit();
    return success();
  };

  return <View style={styles.container} testID="dimmer-structural-preview">
    <Text style={styles.title}>Structural change</Text>
    <Text style={styles.summary}>{changeSet.summary}</Text>
    {changeSet.operations.length === 0
      ? <Text style={styles.empty}>No operations are available for this edit.</Text>
      : changeSet.operations.map((operation, index) => <StructuralOperationRow key={`${operation.kind}-${operation.operation}-${index}`} operation={operation} />)}
    <Pressable
      accessibilityRole="button"
      onPress={() => { setMessage(undefined); setReport(undefined); setStructuralVisible(true); }}
      style={styles.confirmButton}
      testID="dimmer-structural-confirm-trigger"
    ><Text style={styles.confirmText}>Review and apply structural change</Text></Pressable>
    {message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
    <ConfirmDestructiveAction
      visible={structuralVisible}
      onCancel={() => setStructuralVisible(false)}
      onConfirmed={() => {
        setStructuralVisible(false);
        if (deletes.length > 0) setDeleteVisible(true);
        else void commit();
      }}
      spec={destructiveActionSpec(
        "Dimmer configuration",
        "structural change",
        `apply ${changeSet.operations.length} related operation${changeSet.operations.length === 1 ? "" : "s"} as one user-confirmed edit`,
        confirmStructural,
      )}
    />
    {deletes.length > 0 && <ConfirmDestructiveAction
      visible={deleteVisible}
      onCancel={() => setDeleteVisible(false)}
      onConfirmed={() => setDeleteVisible(false)}
      spec={destructiveActionSpec(
        deletes.length === 1 ? operationName(deletes[0]) : `${deletes.length} Hue resources`,
        "Hue resource deletion",
        "delete the selected resource as part of this confirmed structural change",
        confirmDelete,
      )}
    />}
    {report && <StructuralCommitReportView report={report} />}
  </View>;
}

function isStructuralCommitReport(value: StructuralCommitReport | CommandResult): value is StructuralCommitReport {
  return Array.isArray((value as StructuralCommitReport).succeeded)
    && Array.isArray((value as StructuralCommitReport).failedOrAmbiguous)
    && Array.isArray((value as StructuralCommitReport).unattempted);
}

function StructuralCommitReportView({ report }: { readonly report: StructuralCommitReport }): JSX.Element {
  return <View style={styles.report} testID="dimmer-structural-report">
    <Text style={styles.reportTitle}>Result: {report.status === "completed" ? "Completed" : "Stopped"}</Text>
    <OperationResultSection label="Succeeded" results={report.succeeded} testID="dimmer-structural-succeeded" />
    <OperationResultSection label="Failed or ambiguous" results={report.failedOrAmbiguous} testID="dimmer-structural-failed" />
    <OperationResultSection label="Unattempted" results={report.unattempted} testID="dimmer-structural-unattempted" />
  </View>;
}

function OperationResultSection({
  label,
  results,
  testID,
}: {
  readonly label: string;
  readonly results: readonly StructuralCommitReport["operations"][number][];
  readonly testID: string;
}): JSX.Element {
  return <View style={styles.reportSection} testID={testID}>
    <Text style={styles.reportLabel}>{label} ({results.length})</Text>
    {results.length === 0
      ? <Text style={styles.reportEmpty}>None</Text>
      : results.map((result, index) => <View key={`${result.operation.kind}-${result.operation.id || "new"}-${index}`} style={styles.reportOperation}>
        <Text style={styles.reportOperationLabel}>{result.operation.label}</Text>
        {result.reason && <Text style={styles.reportReason}>{result.reason}</Text>}
      </View>)}
  </View>;
}

function StructuralOperationRow({ operation }: { readonly operation: DimmerChangeOperation }): JSX.Element {
  return <View style={styles.operation}>
    <Text style={styles.operationType}>{operation.operation.toUpperCase()} · {capitalize(operation.kind)}</Text>
    <Text style={styles.operationLabel}>{operation.label}</Text>
  </View>;
}

function operationName(operation: DimmerChangeOperation): string {
  return operation.label || `${capitalize(operation.kind)} resource`;
}

function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({
  container: { backgroundColor: "#073642", borderColor: "#586e75", borderRadius: 9, borderWidth: 1, marginTop: 16, padding: 12 },
  title: { color: "#b58900", fontSize: 17, fontWeight: "700" },
  summary: { color: "#fdf6e3", lineHeight: 19, marginTop: 5 },
  empty: { color: "#dc322f", marginTop: 8 },
  operation: { borderTopColor: "#586e75", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 9, paddingTop: 8 },
  operationType: { color: "#93a1a1", fontSize: 12 },
  operationLabel: { color: "#fdf6e3", marginTop: 2 },
  report: { borderTopColor: "#586e75", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 10 },
  reportTitle: { color: "#b58900", fontWeight: "700" },
  reportSection: { marginTop: 9 },
  reportLabel: { color: "#93a1a1", fontSize: 12, fontWeight: "700" },
  reportEmpty: { color: "#93a1a1", marginTop: 3 },
  reportOperation: { marginTop: 4 },
  reportOperationLabel: { color: "#fdf6e3" },
  reportReason: { color: "#dc322f", fontSize: 12, marginTop: 1 },
  confirmButton: { alignSelf: "flex-start", backgroundColor: "#268bd2", borderRadius: 8, marginTop: 12, padding: 11 },
  confirmText: { color: "#fff", fontWeight: "700" },
  message: { color: "#b58900", marginTop: 10 },
});
