import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';

/**
 * Phase 1 placeholder. Real account view/edit form (useUpdateAccount →
 * PUT /api/user/update) lands in Phase 4 — see docs/PHASED_DELIVERY.md.
 */
export function AccountScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Account</Text>
            <Text style={styles.subtitle}>Account management coming in Phase 4.</Text>
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
