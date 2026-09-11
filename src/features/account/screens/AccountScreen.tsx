import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { useAuthStore } from '../../../core/auth/authStore';

/**
 * Phase 2 adds sign-out here (see docs/PHASED_DELIVERY.md); the rest of
 * this screen — viewing/editing the profile via PUT /api/user/update — is
 * still a Phase 4 placeholder. Logout is purely client-side: clearing the
 * persisted session flips RootNavigator back to AuthStack on its own,
 * mirroring the Angular app's `login-service.ts#logout()` (no `/api/logout`
 * call — that route is a session-cookie relic from the web app that never
 * applied to JWT-based clients).
 */
export function AccountScreen() {
    const clearSession = useAuthStore((state) => state.clearSession);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Account</Text>
            <Text style={styles.subtitle}>Account management coming in Phase 4.</Text>
            <Button
                testID="account-logout-button"
                label="Log out"
                variant="danger"
                onPress={() => {
                    void clearSession();
                }}
                style={styles.logoutButton}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.sm
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.textMuted
    },
    logoutButton: {
        marginTop: spacing.xl,
        alignSelf: 'stretch'
    }
});
