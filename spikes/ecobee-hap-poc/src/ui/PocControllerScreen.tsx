import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export interface SanitizedCandidate {
  readonly key: string;
  readonly label: string;
  readonly pairing: 'available' | 'already-associated' | 'unknown';
  readonly pairedToThisApp: boolean;
}

export type TargetRunResult = 'PENDING TARGET' | 'PASS' | 'FAIL' | 'BLOCKED';

export interface TargetRunEvidence {
  readonly id: string;
  readonly label: string;
  readonly result: TargetRunResult;
  readonly summary: string;
}

export interface TargetRunStatus {
  readonly network: 'ready' | 'unavailable';
  readonly evidence: readonly TargetRunEvidence[];
}

const TARGET_RUN_CHECKS: readonly Omit<TargetRunEvidence, 'result'>[] = [
  { id: 'HAP-001', label: 'Live discovery', summary: 'Awaiting a physical HAP browse and local endpoint observation.' },
  { id: 'HAP-003', label: 'Ownership-safe Pair Setup', summary: 'Awaiting an approved target pairing and committed-record result.' },
  { id: 'HAP-004', label: 'Cold Pair Verify', summary: 'Awaiting a force-stop, cold launch, and verified session.' },
  { id: 'HAP-006/007', label: 'Target reads', summary: 'Awaiting sanitized current-temperature and capability evidence.' },
  { id: 'HAP-008', label: 'Safe setpoint write', summary: 'Awaiting read-before/write/read-back/restoration evidence.' },
  { id: 'HAP-010', label: 'Event or polling behavior', summary: 'Awaiting target staleness, traffic, and fallback observations.' },
  { id: 'HAP-011', label: 'Lifecycle recovery', summary: 'Awaiting Wi-Fi, access-point, restart, refusal, and address-change results.' },
  { id: 'HAP-012/013', label: 'WAN-denied local control', summary: 'Awaiting independent router/firewall denial proof and a successful local run.' },
  { id: 'HAP-014', label: 'Android backup audit', summary: 'Awaiting device backup/data-transfer inspection.' },
  { id: 'HAP-016', label: 'Android crypto runtime', summary: 'Awaiting the Hermes/development-build vector result.' },
  { id: 'M3', label: 'Reliability run', summary: 'Awaiting the complete sequential eight-hour target run.' }
];

export function createInitialTargetRunStatus(): TargetRunStatus {
  return {
    network: 'unavailable',
    evidence: TARGET_RUN_CHECKS.map((check) => check.id === 'HAP-016'
      ? { ...check, result: 'FAIL' as const, summary: 'Android Hermes gate failed in Phase 04; a remediation rerun is not promoted.' }
      : { ...check, result: 'PENDING TARGET' as const })
  };
}

export interface PocUiState {
  readonly discovery: 'idle' | 'discovering' | 'ready' | 'error';
  readonly connection: 'idle' | 'pairing' | 'verifying' | 'ready' | 'offline' | 'repair-required';
  readonly candidates: readonly SanitizedCandidate[];
  readonly selected?: SanitizedCandidate;
  readonly capabilities: readonly SanitizedCapability[];
  readonly setpoint?: { readonly value: number; readonly unit: string; readonly min: number; readonly max: number };
  readonly errorMessage?: string;
  readonly targetRun: TargetRunStatus;
}

export interface SanitizedCapability {
  readonly key: string;
  readonly status: 'available' | 'unsupported' | 'invalid' | 'read-failed';
  readonly value?: string | number | boolean;
  readonly unit?: string;
  readonly source?: string;
}

export interface PocUiActions {
  startDiscovery(): void;
  stopDiscovery(): void;
  selectCandidate(key: string): void;
  connectCandidate(key: string): Promise<void>;
  pair(setupCode: string): Promise<void>;
  unpairAccessory(): Promise<void>;
  deleteLocalCredentials(): Promise<void>;
  writeSetpoint(value: number): Promise<void>;
  recordTargetResult(id: string, result: TargetRunResult): void;
}

export const emptyPocUiState: PocUiState = { discovery: 'idle', connection: 'idle', candidates: [], capabilities: [], targetRun: createInitialTargetRunStatus() };

export function PocControllerScreen({ state, actions }: { state: PocUiState; actions: PocUiActions }): React.JSX.Element {
  const [setupCode, setSetupCode] = useState('');
  const [setpoint, setSetpoint] = useState('');
  const selected = state.selected;
  useEffect(() => {
    setSetupCode('');
  }, [selected?.key, selected?.pairing]);
  const requestPair = () => Alert.alert('Pair selected thermostat?', 'The setup code is used only in memory. Pair Setup may change accessory ownership.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Pair', onPress: () => { const code = setupCode; setSetupCode(''); void actions.pair(code); } }
  ]);
  const requestUnpair = () => Alert.alert('Remove POC controller?', 'Accessory-side removal and local credential deletion are separate operations.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove accessory controller', style: 'destructive', onPress: () => void actions.unpairAccessory() }
  ]);
  const requestDeleteLocalCredentials = () => Alert.alert('Delete local credentials?', 'This does not remove the POC controller from the thermostat.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete local credentials', style: 'destructive', onPress: () => void actions.deleteLocalCredentials() }
  ]);
  const requestWrite = () => {
    const value = Number(setpoint);
    if (!state.setpoint || !Number.isFinite(value) || value < state.setpoint.min || value > state.setpoint.max) return;
    Alert.alert('Confirm setpoint', `Write ${value} ${state.setpoint.unit} and confirm it by read-back?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Write', onPress: () => void actions.writeSetpoint(value) }
    ]);
  };
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Local thermostat control</Text>
      <Text style={styles.status}>Discovery: {state.discovery} · Connection: {state.connection}</Text>
      <Button
        title={state.discovery === 'discovering' ? 'Stop discovery' : 'Discover thermostats'}
        onPress={() => state.discovery === 'discovering' ? actions.stopDiscovery() : actions.startDiscovery()}
      />
      {state.candidates.map((candidate) => <View key={candidate.key} style={[styles.candidateRow, candidate.pairedToThisApp && styles.pairedCandidate]}>
        <Text style={styles.candidate}>{candidate.label} · {candidateStatus(candidate)}</Text>
        {candidate.pairedToThisApp
          ? <Button
              title={state.connection === 'ready' && state.selected?.key === candidate.key ? 'Connected' : state.connection === 'verifying' && state.selected?.key === candidate.key ? 'Connecting…' : 'Connect'}
              onPress={() => void actions.connectCandidate(candidate.key)}
              disabled={(state.connection === 'ready' || state.connection === 'verifying') && state.selected?.key === candidate.key}
            />
          : <Button
              title={state.selected?.key === candidate.key ? 'Selected for pairing' : candidate.pairing === 'available' ? 'Select to pair' : 'Unavailable'}
              onPress={() => actions.selectCandidate(candidate.key)}
              disabled={candidate.pairing !== 'available' || state.selected?.key === candidate.key}
            />}
      </View>)}
      {selected && !selected.pairedToThisApp && state.connection !== 'ready' ? <View style={styles.form}>
        <Text style={styles.selected}>Selected target: {selected.label}</Text>
        {selected.pairing === 'available' ? <>
          <Text style={styles.status}>This thermostat is advertising that it accepts Pair Setup.</Text>
          <Text style={styles.status}>Enter the eight digits; separators are added automatically.</Text>
          <TextInput accessibilityLabel="HAP setup code" value={setupCode} onChangeText={(value) => setSetupCode(formatSetupCodeInput(value))} placeholder="XXX-XX-XXX" placeholderTextColor="#93a1a1" keyboardType="number-pad" maxLength={10} style={styles.input} />
          <Button title="Pair selected thermostat" onPress={requestPair} disabled={!/^\d{3}-\d{2}-\d{3}$/.test(setupCode)} />
        </> : <Text style={styles.warning}>
          Pairing unavailable: this thermostat is already associated. Do not enter a setup code.
        </Text>}
      </View> : null}
      {state.connection === 'ready' ? <View style={styles.form}>
        {state.capabilities.map((capability) => <Text key={capability.key} style={styles.status}>
          {capability.key}: {capability.status}{capability.value !== undefined ? ` · ${capability.value}${capability.unit ? ` ${capability.unit}` : ''}` : ''}
        </Text>)}
        {state.setpoint ? <View style={styles.form}>
          <Text style={styles.status}>Current setpoint: {state.setpoint.value} {state.setpoint.unit}</Text>
          <TextInput accessibilityLabel="Safe thermostat setpoint" value={setpoint} onChangeText={setSetpoint} placeholder={`${state.setpoint.min}–${state.setpoint.max}`} placeholderTextColor="#93a1a1" keyboardType="decimal-pad" style={styles.input} />
          <Button title="Write and confirm setpoint" onPress={requestWrite} />
        </View> : <Text style={styles.status}>No writable setpoint is exposed by this target.</Text>}
        <Button title="Remove POC controller" color="#dc322f" onPress={requestUnpair} />
        <Button title="Delete local credentials only" color="#b58900" onPress={requestDeleteLocalCredentials} />
      </View> : null}
      {state.errorMessage ? <Text style={styles.error}>{state.errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 12, marginTop: 24 },
  heading: { color: '#fdf6e3', fontSize: 18, fontWeight: '700' },
  status: { color: '#b8d9c6', fontSize: 14 },
  candidateRow: { gap: 6 },
  pairedCandidate: { borderColor: '#2aa198', borderWidth: 1, borderRadius: 6, padding: 10 },
  candidate: { color: '#eee8d5', fontSize: 15 },
  selected: { color: '#fdf6e3', fontSize: 16, fontWeight: '700' },
  warning: { color: '#b58900', fontSize: 14, lineHeight: 20 },
  form: { gap: 12 },
  input: { color: '#fdf6e3', borderColor: '#586e75', borderWidth: 1, borderRadius: 6, padding: 12 },
  error: { color: '#dc322f' }
});

function candidateStatus(candidate: SanitizedCandidate): string {
  if (candidate.pairedToThisApp) return 'Paired to this app';
  if (candidate.pairing === 'available') return 'Available to pair';
  if (candidate.pairing === 'already-associated') return 'Not paired to this app';
  return 'Pairing status unknown';
}

export function formatSetupCodeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}
