import React, { ReactNode, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export interface AppProvidersProps {
    children: ReactNode;
}

/**
 * Root provider tree: TanStack Query (server state — see
 * docs/MOBILE_APP_ARCHITECTURE.md, "Server state") wrapping React
 * Navigation's container. The QueryClient is created once per app instance
 * via useState's lazy initializer, not at module scope, so it isn't shared
 * across app remounts in tests.
 */
export function AppProviders({ children }: AppProvidersProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <NavigationContainer>{children}</NavigationContainer>
        </QueryClientProvider>
    );
}
