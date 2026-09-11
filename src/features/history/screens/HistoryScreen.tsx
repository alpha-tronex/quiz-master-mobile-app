import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';

/**
 * Phase 1 placeholder. Real history list (useQuizHistory →
 * GET /api/quiz/history/:username) lands in Phase 3 — see
 * docs/PHASED_DELIVERY.md.
 */
export function HistoryScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Quiz history coming in Phase 3.</Text>
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
