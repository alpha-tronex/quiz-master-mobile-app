import React, { ReactNode, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAppStateChange } from './queryFocusManager';

export interface AppProvidersProps {
    children: ReactNode;
}

/**
 * Root provider tree: SafeAreaProvider (so screens can read device safe-area
 * insets — notches, Dynamic Island, home indicator — via useSafeAreaInsets
 * or <SafeAreaView>), wrapping TanStack Query (server state — see
 * docs/MOBILE_APP_ARCHITECTURE.md, "Server state") wrapping React
 * Navigation's container. The QueryClient is created once per app instance
 * via useState's lazy initializer, not at module scope, so it isn't shared
 * across app remounts in tests.
 *
 * Also subscribes React Query's focusManager to RN's AppState (see
 * queryFocusManager.ts) so stale queries — e.g. QuizListScreen's, kept
 * mounted by the bottom-tab navigator — refetch when the app returns to the
 * foreground, not just on true screen remount.
 */
export function AppProviders({ children }: AppProvidersProps) {
    const [queryClient] = useState(() => new QueryClient());

    useEffect(() => {
        const subscription = AppState.addEventListener('change', onAppStateChange);
        return () => subscription.remove();
    }, []);

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <NavigationContainer>{children}</NavigationContainer>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
