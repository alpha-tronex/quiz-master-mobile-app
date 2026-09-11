import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';

/**
 * Phase 1 placeholder — renders so the navigation shell and auth stack are
 * verifiable end to end. The real login form (TextField inputs, validation,
 * useLogin mutation → POST /api/login) lands in Phase 2; see
 * docs/PHASED_DELIVERY.md.
 */
export function LoginScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log in</Text>
            <Text style={styles.subtitle}>Login form coming in Phase 2.</Text>
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
    }
});
