import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AppState, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { createPocController } from '../application/pocController';
import { reactNativeCrypto } from '../hap/crypto/quickCryptoProvider';
import type { VectorRunResult } from '../hap/crypto/vectorRunner';
import { PocControllerScreen } from './PocControllerScreen';
import { TargetRunPanel } from './TargetRunPanel';
import { VectorRunnerPanel } from './VectorRunnerPanel';
import packageMetadata from '../../package.json';

const BUILD_ID = `ecobee-hap-poc@${packageMetadata.version}`;

export function AppShell(): React.JSX.Element {
  const controller = useMemo(() => createPocController(), []);
  const [state, setState] = useState(controller.getState());
  const [vectorResult, setVectorResult] = useState<VectorRunResult>();

  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      // The Android crypto gate is intentionally vector-only. Do not turn an
      // app-state transition into implicit discovery or pairing work.
      if (nextState === 'background' || nextState === 'inactive') void controller.background();
    });
    return () => {
      unsubscribe();
      appStateSubscription.remove();
      void controller.shutdown();
    };
  }, [controller]);

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ecobee local HAP proof of concept</Text>
        <Text style={styles.state}>State: {state.connection}</Text>
        <Text style={styles.detail}>Discovery, pairing, and writes require an explicit operator action.</Text>
        <Text style={styles.build} testID="build-id">Build: {BUILD_ID}</Text>
        <PocControllerScreen state={state} actions={controller} />
        <VectorRunnerPanel provider={reactNativeCrypto} onResult={setVectorResult} />
        <TargetRunPanel status={state.targetRun} vectorResult={vectorResult} onRecord={controller.recordTargetResult.bind(controller)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#002b36' },
  container: { flexGrow: 1, padding: 24, gap: 16, justifyContent: 'center' },
  title: { color: '#fdf6e3', fontSize: 24, fontWeight: '700' },
  state: { color: '#b8d9c6', fontSize: 18 },
  detail: { color: '#eee8d5', fontSize: 15, lineHeight: 22 },
  build: { color: '#93a1a1', fontSize: 12 }
});
