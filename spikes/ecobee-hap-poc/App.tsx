import React from 'react';
import { installRuntimePolyfills } from './src/hap/runtime';
import { AppShell } from './src/ui/AppShell';

installRuntimePolyfills();

export default function App(): React.JSX.Element {
  return <AppShell />;
}
