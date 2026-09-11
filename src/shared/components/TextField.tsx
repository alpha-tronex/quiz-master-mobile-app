import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string | null;
    testID?: string;
}

/**
 * Labeled text input with inline error display. Consumers pass validation
 * results straight from `shared/validation` — `error={result.error}` — so
 * form screens don't need their own error-rendering logic.
 */
export function TextField({ label, error, testID, ...inputProps }: TextFieldProps) {
    const hasError = Boolean(error);

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TextInput
                testID={testID}
                accessibilityLabel={label}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, hasError && styles.inputError]}
                {...inputProps}
            />
            {hasError ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

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
    inputError: {
        borderColor: colors.danger
    },
    error: {
        marginTop: spacing.xs,
        fontSize: typography.fontSize.xs,
        color: colors.danger
    }
});
