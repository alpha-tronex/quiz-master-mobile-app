import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

export interface LoadingStateProps {
    testID?: string;
}

/**
 * Centered spinner for a screen's full-bleed loading state (a query still
 * pending). Extracted from the near-identical markup previously duplicated
 * across QuizListScreen, HistoryScreen and TakeQuizScreen so the loading
 * treatment can't quietly drift between screens.
 */
export function LoadingState({ testID }: LoadingStateProps) {
    return (
        <View style={styles.centered} testID={testID}>
            <ActivityIndicator color={colors.primary} size="large" />
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
    }
});
