import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { RootNavigator } from '../RootNavigator';
import { useAuthStore } from '../../../core/auth/authStore';

const netInfoMock = NetInfo as unknown as {
    __setState: (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;
    __reset: () => void;
};

const renderRootNavigator = () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

    return render(
        <QueryClientProvider client={queryClient}>
            <NavigationContainer>
                <RootNavigator />
            </NavigationContainer>
        </QueryClientProvider>
    );
};

afterEach(() => {
    useAuthStore.setState({ user: null, token: null, isHydrating: true });
    netInfoMock.__reset();
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

        expect(screen.getByRole('header', { name: 'Log in' })).toBeTruthy();
    });

    test('renders the main tabs when a token is present', async () => {
        useAuthStore.setState({ isHydrating: false, token: 'jwt-abc' });

        await renderRootNavigator();

        // Asserted via the tab bar rather than Home screen content, so this
        // test doesn't couple to what Home happens to render (its content
        // depends on quiz history, which isn't mocked in this suite).
        expect(screen.getByTestId('tab-home')).toBeTruthy();
    });

    test('does not show the offline banner while connected', async () => {
        useAuthStore.setState({ isHydrating: false, token: null });

        await renderRootNavigator();

        expect(screen.queryByTestId('offline-banner')).toBeNull();
    });

    test('shows the offline banner when connectivity is lost, and hides it once restored', async () => {
        useAuthStore.setState({ isHydrating: false, token: null });

        await renderRootNavigator();
        expect(screen.queryByTestId('offline-banner')).toBeNull();

        netInfoMock.__setState({ isConnected: false, isInternetReachable: false });
        await waitFor(() => expect(screen.getByTestId('offline-banner')).toBeTruthy());

        netInfoMock.__setState({ isConnected: true, isInternetReachable: true });
        await waitFor(() => expect(screen.queryByTestId('offline-banner')).toBeNull());
    });
});
