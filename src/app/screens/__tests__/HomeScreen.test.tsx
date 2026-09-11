import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

test('HomeScreen renders a welcome message', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Welcome to Quiz Master')).toBeTruthy();
});
