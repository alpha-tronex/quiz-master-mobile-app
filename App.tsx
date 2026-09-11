import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from './src/app/providers/AppProviders';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { useAuthStore } from './src/core/auth/authStore';

export default function App() {
    const hydrate = useAuthStore((state) => state.hydrate);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return (
        <AppProviders>
            <RootNavigator />
            <StatusBar style="auto" />
        </AppProviders>
    );
}
