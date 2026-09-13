import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

export interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    testID?: string;
    style?: ViewStyle;
}

/**
 * Base pressable button. `disabled` and `loading` both suppress `onPress`;
 * `loading` additionally swaps the label for a spinner so callers don't need
 * to duplicate that logic per screen (e.g. the login/register submit buttons).
 */
export function Button({
    label,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    testID,
    style
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            testID={testID}
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                variantStyles[variant],
                isDisabled && styles.disabled,
                pressed && !isDisabled && styles.pressed,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={spinnerColorByVariant[variant]} />
            ) : (
                // numberOfLines/adjustsFontSizeToFit stop a long label from wrapping onto a
                // second line when the button is squeezed (e.g. three buttons sharing a row) —
                // it shrinks the font just enough to stay on one line instead.
                <Text
                    style={[styles.label, labelVariantStyles[variant]]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                >
                    {label}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        minHeight: 44
    },
    pressed: {
        opacity: 0.85
    },
    disabled: {
        opacity: 0.5
    },
    label: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold
    }
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    // `colors.primary` on its own only manages ~2.4:1 as a 1px border,
    // still under the 3:1 non-text minimum; `primaryText` clears it.
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primaryText },
    danger: { backgroundColor: colors.danger }
};

// White text on the teal `primary` background is only ~2.4:1 — well under
// the 4.5:1 AA minimum for the bold button label — so the primary variant
// uses the dark `secondary` navy instead, matching the web app's own
// button styling. `danger` keeps white text; `#dc3545` is dark enough
// to clear 4.5:1 with white.
const labelVariantStyles: Record<ButtonVariant, { color: string }> = {
    primary: { color: colors.secondary },
    secondary: { color: colors.textInverse },
    outline: { color: colors.primaryText },
    danger: { color: colors.textInverse }
};

const spinnerColorByVariant: Record<ButtonVariant, string> = {
    primary: colors.secondary,
    secondary: colors.textInverse,
    outline: colors.primaryText,
    danger: colors.textInverse
};
