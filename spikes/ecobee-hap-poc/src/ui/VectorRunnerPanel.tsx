import React, { useState } from 'react';
import { Button, Text } from 'react-native';
import type { CryptoProvider } from '../hap/ports/contracts';
import { runCryptoVectorSuite, type VectorRunResult } from '../hap/crypto/vectorRunner';

export function VectorRunnerPanel({ provider, onResult }: { provider: CryptoProvider; onResult?: (result: VectorRunResult) => void }): React.JSX.Element {
  const [result, setResult] = useState<VectorRunResult>();
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    try {
      const nextResult = await runCryptoVectorSuite(provider);
      setResult(nextResult);
      onResult?.(nextResult);
    } finally {
      setRunning(false);
    }
  };
  return <>
    <Button title={running ? 'Running crypto vectors…' : 'Run crypto qualification vectors'} onPress={() => void run()} disabled={running} />
    {result ? <Text>Crypto vectors: {result.passed} passed, {result.failed} failed ({result.provider})</Text> : null}
    {result?.failures.length ? <Text>Failed vector names: {result.failures.join(', ')}</Text> : null}
  </>;
}
