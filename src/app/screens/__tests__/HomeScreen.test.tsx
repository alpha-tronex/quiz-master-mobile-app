import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

test('HomeScreen renders a welcome message', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('Welcome to Quiz Master')).toBeTruthy();
});

test('HomeScreen renders its title as a header for screen readers', async () => {
    await render(<HomeScreen />);

    expect(screen.getByRole('header', { name: 'Welcome to Quiz Master' })).toBeTruthy();
});
