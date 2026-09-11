import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';

/**
 * Phase 1 placeholder — see LoginScreen.tsx. Real register form
 * (TextField inputs, validation, useRegister mutation → POST /api/register)
 * lands in Phase 2.
 */
export function RegisterScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subtitle}>Registration form coming in Phase 2.</Text>
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
