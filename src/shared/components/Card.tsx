import React, { ReactNode } from 'react';
import { AccessibilityRole, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme';

export interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    testID?: string;
    /**
     * Accessibility pass-through props. Cards typically wrap several `Text`
     * children (title, date, score, etc.) which a screen reader would
     * otherwise announce as separate fragments. Pass `accessible` with an
     * `accessibilityLabel` summarizing the card's content to have it
     * announced as one unit instead.
     */
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: AccessibilityRole;
    accessibilityHint?: string;
}

/** Elevated surface container used for quiz list items, result summaries, etc. */
export function Card({
    children,
    style,
    testID,
    accessible,
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint
}: CardProps) {
    return (
        <View
            testID={testID}
            style={[styles.card, style]}
            accessible={accessible}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={accessibilityRole}
            accessibilityHint={accessibilityHint}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1
    }
});
