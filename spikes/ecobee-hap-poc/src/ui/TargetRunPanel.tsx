import React from 'react';
import { Alert, Button, Share, StyleSheet, Text, View } from 'react-native';
import type { VectorRunResult } from '../hap/crypto/vectorRunner';
import type { TargetRunEvidence, TargetRunResult, TargetRunStatus } from './PocControllerScreen';

export function TargetRunPanel({
  status,
  vectorResult,
  onRecord
}: {
  status: TargetRunStatus;
  vectorResult?: VectorRunResult;
  onRecord(id: string, result: TargetRunResult): void;
}): React.JSX.Element {
  const record = (evidence: TargetRunEvidence) => Alert.alert(
    `Record ${evidence.id}`,
    'Use only after the corresponding physical procedure. The sheet stores result categories and sanitized summaries, never diagnostic logs or target identifiers.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'PASS', onPress: () => onRecord(evidence.id, 'PASS') },
      { text: 'FAIL', style: 'destructive', onPress: () => onRecord(evidence.id, 'FAIL') },
      { text: 'BLOCKED', onPress: () => onRecord(evidence.id, 'BLOCKED') },
      { text: 'Reset to pending', onPress: () => onRecord(evidence.id, 'PENDING TARGET') }
    ]
  );
  const share = () => {
    const vectorStatus = vectorResult ? `${vectorResult.failed === 0 ? 'PASS' : 'FAIL'} (${vectorResult.passed} passed, ${vectorResult.failed} failed)` : 'PENDING TARGET';
    const message = [
      'Ecobee HAP POC target run (sanitized)',
      `Active Wi-Fi guard: ${status.network === 'ready' ? 'READY' : 'BLOCKED'}`,
      `Android crypto vectors: ${vectorStatus}`,
      'Phase 04 Android crypto/runtime gate record: FAIL (initial Hermes incompatibility; remediation rerun not promoted)',
      ...status.evidence.map((evidence) => `${evidence.id}: ${evidence.result}`)
    ].join('\n');
    void Share.share({ message }).catch(() => undefined);
  };

  return (
    <View style={styles.panel} accessibilityLabel="Sanitized target run status">
      <Text style={styles.heading}>Sanitized target-run sheet</Text>
      <Text style={styles.status}>
        Active Wi-Fi guard: {status.network === 'ready' ? 'READY (transport and CIDR available)' : 'BLOCKED (active Wi-Fi data unavailable)'}
      </Text>
      <Text style={styles.detail}>Record only the result category for each physical gate. Do not paste diagnostic output, addresses, setup codes, keys, or payloads here.</Text>
      <Text style={styles.status}>
        Android crypto vectors: {vectorResult ? `${vectorResult.failed === 0 ? 'PASS' : 'FAIL'} · ${vectorResult.passed} passed · ${vectorResult.failed} failed` : 'PENDING TARGET'}
      </Text>
      <Text style={styles.detail}>Phase 04 gate record: FAIL · initial Hermes runtime incompatibility; the bounded remediation rerun is evidence only and is not promoted.</Text>
      <Button title="Share sanitized sheet" onPress={share} />
      {status.evidence.map((evidence) => (
        <View key={evidence.id} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.item}>{evidence.id} · {evidence.label}</Text>
            <Text style={styles.detail}>{evidence.result} · {evidence.summary}</Text>
          </View>
          <Button title="Record" onPress={() => record(evidence)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 10, marginTop: 20, paddingTop: 16, borderTopColor: '#586e75', borderTopWidth: 1 },
  heading: { color: '#fdf6e3', fontSize: 18, fontWeight: '700' },
  status: { color: '#b8d9c6', fontSize: 14 },
  detail: { color: '#93a1a1', fontSize: 12, lineHeight: 18 },
  row: { gap: 6, paddingVertical: 6 },
  copy: { gap: 3 },
  item: { color: '#eee8d5', fontSize: 14, fontWeight: '600' }
});
