import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';

test('LoginScreen renders its title', async () => {
    await render(<LoginScreen />);

    expect(screen.getByText('Log in')).toBeTruthy();
});
