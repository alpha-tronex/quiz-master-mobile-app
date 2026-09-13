import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

export type BannerVariant = 'error' | 'success';

export interface BannerProps {
    message: string;
    variant: BannerVariant;
    testID?: string;
}

/**
 * Inline status message shown above a form — a mutation failing (login,
 * register, account save) or succeeding (account save) — as opposed to
 * `ErrorState`, which replaces an entire screen whose data failed to load.
 * `error` announces itself to screen readers immediately via
 * `accessibilityRole="alert"`; `success` only updates the live region,
 * since it isn't blocking anything the user needs to act on.
 */
export function Banner({ message, variant, testID }: BannerProps) {
    return (
        <Text
            style={[styles.base, variant === 'error' ? styles.error : styles.success]}
            testID={testID}
            accessibilityRole={variant === 'error' ? 'alert' : undefined}
            accessibilityLiveRegion="polite"
        >
            {message}
        </Text>
    );
}

const styles = StyleSheet.create({
    base: {
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.md,
        textAlign: 'center'
    },
    error: {
        color: colors.dangerText
    },
    success: {
        color: colors.successText
    }
});
