import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../../core/auth/authStore';
import { InactivityGate } from '../../core/auth/InactivityGate';
import { useNetworkStatus } from '../../core/network/useNetworkStatus';
import { colors } from '../../shared/theme';
import { OfflineBanner } from '../../shared/components';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

/**
 * Switches between the unauthenticated and authenticated route groups based
 * on `authStore.token` — no role branching (see MainTabs.tsx). Renders a
 * blocking spinner while the persisted session is still being read from
 * secure storage at launch, so the auth stack doesn't flash before a valid
 * session is restored.
 *
 * Also renders a global `OfflineBanner` above whichever stack is active, so
 * connectivity loss is visible regardless of auth state or which screen is
 * showing. Wrapped in `InactivityGate` so a signed-in user is logged out
 * after 15 minutes with no touch anywhere in the app (see
 * `core/auth/useInactivityTimeout.ts`) — placed here rather than deeper
 * inside `MainTabs` so it also covers `AuthStack` screens like Register,
 * even though only a `token` arms the actual timer.
 */
export function RootNavigator() {
    const token = useAuthStore((state) => state.token);
    const isHydrating = useAuthStore((state) => state.isHydrating);
    const isOnline = useNetworkStatus();

    if (isHydrating) {
        return (
            <View style={styles.loading} testID="root-navigator-loading">
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return (
        <InactivityGate>
            <View style={styles.root}>
                {isOnline ? null : <OfflineBanner />}
                {token ? <MainTabs /> : <AuthStack />}
            </View>
        </InactivityGate>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background
    }
});
