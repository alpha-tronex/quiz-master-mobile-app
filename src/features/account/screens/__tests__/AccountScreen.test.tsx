import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AccountScreen } from '../AccountScreen';

test('AccountScreen renders its title', async () => {
    await render(<AccountScreen />);

    expect(screen.getByText('Account')).toBeTruthy();
});
