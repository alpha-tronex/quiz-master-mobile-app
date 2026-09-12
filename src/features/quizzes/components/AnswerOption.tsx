import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../../shared/theme';

export type AnswerOptionVariant = 'checkbox' | 'radio';

export interface AnswerOptionProps {
    text: string;
    selected: boolean;
    onPress: () => void;
    /**
     * 'checkbox' (square indicator) for MultipleChoice questions, where more
     * than one answer can be selected at once. 'radio' (round indicator) for
     * SingleAnswer/TrueFalse questions, where selecting one clears any prior
     * selection — see TakeQuizScreen's recordMultiChoiceAnswer/
     * recordSingleAnswer, ported from questions.component.ts.
     */
    variant: AnswerOptionVariant;
    testID?: string;
}

/**
 * A single tappable answer row. React Native has no built-in checkbox/radio
 * input, so this replaces questions.component.html's disabled text input +
 * native checkbox/radio pair with one Pressable row that shows the answer
 * text alongside a hand-drawn indicator.
 */
export function AnswerOption({ text, selected, onPress, variant, testID }: AnswerOptionProps) {
    return (
        <Pressable
            testID={testID}
            onPress={onPress}
            accessibilityRole={variant === 'checkbox' ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: selected }}
            accessibilityLabel={text}
            style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}
        >
            <Text style={styles.text}>{text}</Text>
            <View style={[styles.indicator, variant === 'radio' && styles.radioIndicator, selected && styles.indicatorSelected]}>
                {selected ? <View style={[styles.dot, variant === 'radio' && styles.radioDot]} /> : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        backgroundColor: colors.background
    },
    rowSelected: {
        borderColor: colors.primary
    },
    pressed: {
        opacity: 0.7
    },
    text: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: colors.text,
        marginRight: spacing.md
    },
    indicator: {
        width: 24,
        height: 24,
        borderRadius: radii.sm,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center'
    },
    radioIndicator: {
        borderRadius: radii.pill
    },
    indicatorSelected: {
        borderColor: colors.primary
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: radii.sm / 2,
        backgroundColor: colors.primary
    },
    radioDot: {
        borderRadius: radii.pill
    }
});
