import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string | null;
    testID?: string;
    /**
     * Renders a trailing eye icon that toggles this field's own
     * `secureTextEntry` between hidden and visible. Password fields should
     * use this instead of passing `secureTextEntry` directly — `TextField`
     * owns the show/hide state itself so every password field in the app
     * (login, register, confirm-password, ...) gets identical behavior
     * without each screen re-implementing it.
     */
    isPassword?: boolean;
}

/**
 * Labeled text input with inline error display. Consumers pass validation
 * results straight from `shared/validation` — `error={result.error}` — so
 * form screens don't need their own error-rendering logic.
 *
 * Forwards its ref to the underlying `TextInput` so a screen can chain
 * `onSubmitEditing` to `.focus()` the next field, or fire its submit
 * handler from the last field in the form (the on-screen keyboard's
 * return/"go" key is the mobile equivalent of pressing Enter).
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
    { label, error, testID, isPassword, secureTextEntry, ...inputProps },
    ref
) {
    const hasError = Boolean(error);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const resolvedSecureTextEntry = isPassword ? !passwordVisible : secureTextEntry;

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={styles.inputRow}>
                <TextInput
                    ref={ref}
                    testID={testID}
                    accessibilityLabel={label}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, isPassword && styles.inputWithToggle, hasError && styles.inputError]}
                    secureTextEntry={resolvedSecureTextEntry}
                    {...inputProps}
                />
                {isPassword ? (
                    <Pressable
                        testID={testID ? `${testID}-toggle-visibility` : undefined}
                        accessibilityRole="button"
                        accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                        onPress={() => setPasswordVisible((visible) => !visible)}
                        hitSlop={8}
                        style={styles.toggleButton}
                    >
                        <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
                    </Pressable>
                ) : null}
            </View>
            {hasError ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.xs
    },
    inputRow: {
        justifyContent: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text,
        backgroundColor: colors.background
    },
    inputWithToggle: {
        paddingRight: spacing.xl
    },
    toggleButton: {
        position: 'absolute',
        right: spacing.sm,
        padding: spacing.xs
    },
    inputError: {
        borderColor: colors.danger
    },
    error: {
        marginTop: spacing.xs,
        fontSize: typography.fontSize.xs,
        color: colors.danger
    }
});
