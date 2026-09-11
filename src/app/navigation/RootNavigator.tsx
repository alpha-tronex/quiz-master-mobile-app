import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../../core/auth/authStore';
import { colors } from '../../shared/theme';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

/**
 * Switches between the unauthenticated and authenticated route groups based
 * on `authStore.token` — no role branching (see MainTabs.tsx). Renders a
 * blocking spinner while the persisted session is still being read from
 * secure storage at launch, so the auth stack doesn't flash before a valid
 * session is restored.
 */
export function RootNavigator() {
    const token = useAuthStore((state) => state.token);
    const isHydrating = useAuthStore((state) => state.isHydrating);

    if (isHydrating) {
        return (
            <View style={styles.loading} testID="root-navigator-loading">
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return token ? <MainTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background
    }
});
