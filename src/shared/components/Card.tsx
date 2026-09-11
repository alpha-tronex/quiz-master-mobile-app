import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme';

export interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    testID?: string;
}

/** Elevated surface container used for quiz list items, result summaries, etc. */
export function Card({ children, style, testID }: CardProps) {
    return (
        <View testID={testID} style={[styles.card, style]}>
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
