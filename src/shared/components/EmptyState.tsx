import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

export interface EmptyStateProps {
    message: string;
    testID?: string;
}

/**
 * Centered muted message for a screen's empty-list state. Extracted from
 * the near-identical markup previously duplicated across QuizListScreen and
 * HistoryScreen.
 */
export function EmptyState({ message, testID }: EmptyStateProps) {
    return (
        <View style={styles.centered}>
            <Text style={styles.subtitle} testID={testID}>
                {message}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.textMuted,
        textAlign: 'center'
    }
});
