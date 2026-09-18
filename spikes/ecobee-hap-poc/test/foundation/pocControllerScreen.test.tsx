import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  createInitialTargetRunStatus,
  PocControllerScreen,
  type PocUiActions,
  type PocUiState,
  type TargetRunResult
} from '../../src/ui/PocControllerScreen';

class BoundActionProbe implements PocUiActions {
  startCalls = 0;
  stopCalls = 0;

  startDiscovery(): void {
    this.startCalls += 1;
  }

  stopDiscovery(): void {
    this.stopCalls += 1;
  }

  selectCandidate(_key: string): void {}
  async pair(_setupCode: string): Promise<void> {}
  async unpairAccessory(): Promise<void> {}
  async deleteLocalCredentials(): Promise<void> {}
  async writeSetpoint(_value: number): Promise<void> {}
  recordTargetResult(_id: string, _result: TargetRunResult): void {}
}

function state(discovery: PocUiState['discovery']): PocUiState {
  return {
    discovery,
    connection: 'idle',
    candidates: [],
    capabilities: [],
    targetRun: createInitialTargetRunStatus()
  };
}

describe('POC controller discovery controls', () => {
  it('invokes class-backed start and stop actions with their receiver intact', () => {
    const actions = new BoundActionProbe();
    const view = render(<PocControllerScreen state={state('idle')} actions={actions} />);

    fireEvent.press(view.getByText('Discover thermostats'));
    expect(actions.startCalls).toBe(1);

    view.rerender(<PocControllerScreen state={state('discovering')} actions={actions} />);
    fireEvent.press(view.getByText('Stop discovery'));
    expect(actions.stopCalls).toBe(1);
  });
});
