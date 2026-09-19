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
  connectCalls: string[] = [];

  startDiscovery(): void {
    this.startCalls += 1;
  }

  stopDiscovery(): void {
    this.stopCalls += 1;
  }

  selectCandidate(_key: string): void {}
  async connectCandidate(key: string): Promise<void> { this.connectCalls.push(key); }
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

function selectedState(pairing: 'available' | 'already-associated'): PocUiState {
  const selected = { key: 'Thermostat 1', label: 'Thermostat 1', pairing, pairedToThisApp: false } as const;
  return {
    ...state('ready'),
    candidates: [selected],
    selected
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

  it('does not request a setup code for an already-associated thermostat', () => {
    const view = render(<PocControllerScreen state={selectedState('already-associated')} actions={new BoundActionProbe()} />);

    expect(view.getByText('Selected target: Thermostat 1')).toBeTruthy();
    expect(view.getByText(/Pairing unavailable/)).toBeTruthy();
    expect(view.queryByLabelText('HAP setup code')).toBeNull();
    expect(view.queryByText('Pair selected thermostat')).toBeNull();
  });

  it('identifies the stored pairing and offers connection instead of Pair Setup', () => {
    const actions = new BoundActionProbe();
    const paired = { key: 'Thermostat 2', label: 'Paired thermostat', pairing: 'already-associated', pairedToThisApp: true } as const;
    const pairedState = { ...state('ready'), candidates: [paired], selected: paired };
    const view = render(<PocControllerScreen state={pairedState} actions={actions} />);

    expect(view.getByText('Paired thermostat · Paired to this app')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Connect' }));
    expect(actions.connectCalls).toEqual(['Thermostat 2']);
    expect(view.queryByLabelText('HAP setup code')).toBeNull();
  });

  it('shows setup-code controls only for an explicitly selected available thermostat', () => {
    const view = render(<PocControllerScreen state={selectedState('available')} actions={new BoundActionProbe()} />);

    expect(view.getByText('Selected target: Thermostat 1')).toBeTruthy();
    expect(view.getByLabelText('HAP setup code')).toBeTruthy();
    expect(view.getByText('Pair selected thermostat')).toBeTruthy();
    expect(view.queryByText(/Pairing unavailable/)).toBeNull();
  });

  it('formats eight setup-code digits and enables pairing only when complete', () => {
    const view = render(<PocControllerScreen state={selectedState('available')} actions={new BoundActionProbe()} />);
    const input = view.getByLabelText('HAP setup code');

    fireEvent.changeText(input, '2468');
    expect(view.getByLabelText('HAP setup code').props.value).toBe('246-8');
    expect(view.getByRole('button', { name: 'Pair selected thermostat' })).toBeDisabled();

    fireEvent.changeText(view.getByLabelText('HAP setup code'), '24680135');
    expect(view.getByLabelText('HAP setup code').props.value).toBe('246-80-135');
    expect(view.getByLabelText('HAP setup code').props.secureTextEntry).not.toBe(true);
    expect(view.getByRole('button', { name: 'Pair selected thermostat' })).toBeEnabled();
  });

  it('clears a partial setup code when the selected target disappears', () => {
    const view = render(<PocControllerScreen state={selectedState('available')} actions={new BoundActionProbe()} />);
    fireEvent.changeText(view.getByLabelText('HAP setup code'), '2468');

    view.rerender(<PocControllerScreen state={state('idle')} actions={new BoundActionProbe()} />);
    view.rerender(<PocControllerScreen state={selectedState('available')} actions={new BoundActionProbe()} />);

    expect(view.getByLabelText('HAP setup code').props.value).toBe('');
  });
});
