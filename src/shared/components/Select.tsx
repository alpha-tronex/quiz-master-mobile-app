import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    label?: string;
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string | null;
    testID?: string;
}

/**
 * Dropdown selector styled to match `TextField`, backed by a full-screen
 * modal list rather than `@react-native-picker/picker`. A custom modal +
 * `Pressable` rows behaves identically on iOS/Android/Expo Go (no native
 * spinner-vs-inline-dropdown divergence between platforms to reconcile),
 * and needs no native-module Jest mocking to unit test — every row is just
 * a `Pressable` the tests can find and tap directly.
 *
 * Used for the account-edit form's State/Country fields (see
 * `features/account/screens/AccountScreen.tsx`), matching the web app's
 * `<select>` dropdowns without hand-porting a native picker widget.
 */
export function Select({ label, value, onValueChange, options, placeholder = 'Select...', error, testID }: SelectProps) {
    const [open, setOpen] = useState(false);
    const hasError = Boolean(error);
    const selected = options.find((option) => option.value === value);

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <Pressable
                testID={testID}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => setOpen(true)}
                style={[styles.trigger, hasError && styles.triggerError]}
            >
                <Text style={[styles.triggerText, !selected && styles.placeholderText]} numberOfLines={1}>
                    {selected ? selected.label : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            {hasError ? <Text style={styles.error}>{error}</Text> : null}

            <Modal
                visible={open}
                animationType="slide"
                transparent
                onRequestClose={() => setOpen(false)}
                testID={testID ? `${testID}-modal` : undefined}
            >
                <Pressable style={styles.backdrop} onPress={() => setOpen(false)} testID={testID ? `${testID}-backdrop` : undefined}>
                    <View style={styles.sheet}>
                        {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            style={styles.optionList}
                            renderItem={({ item }) => (
                                <Pressable
                                    testID={testID ? `${testID}-option-${item.value}` : undefined}
                                    accessibilityRole="button"
                                    accessibilityLabel={item.label}
                                    accessibilityState={{ selected: item.value === value }}
                                    onPress={() => {
                                        onValueChange(item.value);
                                        setOpen(false);
                                    }}
                                    style={styles.option}
                                >
                                    <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                                        {item.label}
                                    </Text>
                                    {item.value === value ? (
                                        <Ionicons name="checkmark" size={18} color={colors.primaryText} />
                                    ) : null}
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
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
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background,
        minHeight: 44
    },
    triggerError: {
        borderColor: colors.danger
    },
    triggerText: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: colors.text
    },
    placeholderText: {
        color: colors.textMuted
    },
    error: {
        marginTop: spacing.xs,
        fontSize: typography.fontSize.xs,
        color: colors.dangerText
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end'
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: radii.lg,
        borderTopRightRadius: radii.lg,
        maxHeight: '70%',
        paddingTop: spacing.md
    },
    sheetTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm
    },
    optionList: {
        paddingHorizontal: spacing.lg
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border
    },
    optionText: {
        fontSize: typography.fontSize.md,
        color: colors.text
    },
    optionTextSelected: {
        fontWeight: typography.fontWeight.bold,
        color: colors.primaryText
    }
});
