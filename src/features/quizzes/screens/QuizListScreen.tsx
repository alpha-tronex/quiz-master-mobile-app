import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';

/**
 * Phase 1 placeholder. Real quiz list (useQuizzes → GET /api/quizzes,
 * rendered as Card items) lands in Phase 3 — see docs/PHASED_DELIVERY.md.
 */
export function QuizListScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quizzes</Text>
            <Text style={styles.subtitle}>Quiz list coming in Phase 3.</Text>
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
