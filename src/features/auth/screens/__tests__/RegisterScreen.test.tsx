import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';

test('RegisterScreen renders its title', async () => {
    await render(<RegisterScreen />);

    expect(screen.getByText('Register')).toBeTruthy();
});
