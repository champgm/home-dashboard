import React from 'react';
import { render } from '@testing-library/react-native';
import { AppShell } from '../../src/ui/AppShell';

describe('foundation shell', () => {
  it('shows only sanitized state and no raw protocol controls', () => {
    const { getByTestId, queryByText } = render(<AppShell />);
    expect(getByTestId('build-id').props.children.join('')).toContain('ecobee-hap-poc');
    expect(queryByText('Run crypto qualification vectors')).not.toBeNull();
    expect(queryByText('Sanitized target-run sheet')).not.toBeNull();
    expect(queryByText(/host|port|raw|console/i)).toBeNull();
  });
});
