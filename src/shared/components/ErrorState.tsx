import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../theme';

export interface ErrorStateProps {
    message: string;
    testID?: string;
    /** Omit to render the message with no Retry action (e.g. a permanent failure). */
    onRetry?: () => void;
    retrying?: boolean;
    retryTestID?: string;
}

/**
 * Centered error message with an optional Retry button, for a screen's
 * full-bleed error state — as opposed to `Banner`, which is an inline
 * message next to a form that's still usable. Extracted from the
 * near-identical markup previously duplicated across QuizListScreen,
 * HistoryScreen and TakeQuizScreen.
 */
export function ErrorState({ message, testID, onRetry, retrying = false, retryTestID }: ErrorStateProps) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText} testID={testID}>
                {message}
            </Text>
            {onRetry ? (
                <Button
                    label="Retry"
                    variant="outline"
                    onPress={onRetry}
                    loading={retrying}
                    testID={retryTestID}
                    style={styles.retryButton}
                />
            ) : null}
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
    errorText: {
        fontSize: typography.fontSize.md,
        color: colors.dangerText,
        textAlign: 'center',
        marginBottom: spacing.md
    },
    retryButton: {
        minWidth: 120
    }
});
