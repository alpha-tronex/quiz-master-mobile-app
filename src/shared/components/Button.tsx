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
                <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.textInverse} />
            ) : (
                <Text style={[styles.label, labelVariantStyles[variant]]}>{label}</Text>
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
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
    danger: { backgroundColor: colors.danger }
};

const labelVariantStyles: Record<ButtonVariant, { color: string }> = {
    primary: { color: colors.textInverse },
    secondary: { color: colors.textInverse },
    outline: { color: colors.primary },
    danger: { color: colors.textInverse }
};
