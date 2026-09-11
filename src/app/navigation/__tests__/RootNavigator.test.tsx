import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import { RootNavigator } from '../RootNavigator';
import { useAuthStore } from '../../../core/auth/authStore';

const renderRootNavigator = () =>
    render(
        <NavigationContainer>
            <RootNavigator />
        </NavigationContainer>
    );

afterEach(() => {
    useAuthStore.setState({ user: null, token: null, isHydrating: true });
});

describe('RootNavigator', () => {
    test('shows a loading spinner while the session is hydrating', async () => {
        useAuthStore.setState({ isHydrating: true, token: null });

        await renderRootNavigator();

        expect(screen.getByTestId('root-navigator-loading')).toBeTruthy();
    });

    test('renders the auth stack when hydration finishes with no token', async () => {
        useAuthStore.setState({ isHydrating: false, token: null });

        await renderRootNavigator();

        expect(screen.getByText('Log in')).toBeTruthy();
    });

    test('renders the main tabs when a token is present', async () => {
        useAuthStore.setState({ isHydrating: false, token: 'jwt-abc' });

        await renderRootNavigator();

        expect(screen.getByText('Welcome to Quiz Master')).toBeTruthy();
    });
});
