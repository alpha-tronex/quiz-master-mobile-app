import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export type BadgeVariant = 'success' | 'info' | 'neutral';

export interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    testID?: string;
    style?: ViewStyle;
}

/**
 * Small pill-shaped label for calling out a single fact about its parent
 * (e.g. "Personal best!" on a stat card) — not interactive, and not a
 * notification/unread-count indicator (there's no such concept in this app).
 */
export function Badge({ label, variant = 'neutral', testID, style }: BadgeProps) {
    return (
        <View style={[styles.badge, variantStyles[variant], style]} testID={testID}>
            <Text style={[styles.label, labelVariantStyles[variant]]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
        paddingVertical: spacing.xs / 2,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.pill
    },
    label: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold
    }
});

// Same tinted-background-plus-dark-text pattern as the semantic *Text colors
// in theme.ts (see its contrast-audit comment) — the tint is decorative, the
// label text is what needs to clear 4.5:1.
const variantStyles: Record<BadgeVariant, ViewStyle> = {
    success: { backgroundColor: 'rgba(32, 134, 55, 0.12)' },
    info: { backgroundColor: 'rgba(0, 113, 235, 0.12)' },
    neutral: { backgroundColor: colors.surface }
};

const labelVariantStyles: Record<BadgeVariant, { color: string }> = {
    success: { color: colors.successText },
    info: { color: colors.infoText },
    neutral: { color: colors.textMuted }
};
