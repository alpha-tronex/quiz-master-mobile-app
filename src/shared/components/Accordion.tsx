import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { colors, spacing, typography } from '../theme';

export interface AccordionProps {
    title: string;
    subtitle?: string;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
    testID?: string;
    /** Defaults to `title` — override when the header needs a fuller screen-reader announcement. */
    accessibilityLabel?: string;
}

/**
 * Collapsible section built on `Card` + `Pressable`, following the same
 * "hand-rolled, no UI library" pattern as `Select`'s modal sheet. Controlled
 * (expanded/onToggle live in the parent) rather than managing its own state,
 * so a list of many accordions (see HistoryScreen) can track which ones are
 * open without reaching into child instances.
 */
export function Accordion({ title, subtitle, expanded, onToggle, children, testID, accessibilityLabel }: AccordionProps) {
    return (
        <Card style={styles.card} testID={testID}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={accessibilityLabel ?? title}
                accessibilityHint={expanded ? 'Collapses this section' : 'Expands this section'}
                onPress={onToggle}
                style={styles.header}
                testID={testID ? `${testID}-header` : undefined}
            >
                <View style={styles.headerText}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </Pressable>
            {expanded ? (
                <View style={styles.content} testID={testID ? `${testID}-content` : undefined}>
                    {children}
                </View>
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: spacing.md,
        padding: 0,
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        minHeight: 44
    },
    headerText: {
        flex: 1,
        marginRight: spacing.sm
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text
    },
    subtitle: {
        marginTop: spacing.xs / 2,
        fontSize: typography.fontSize.sm,
        color: colors.textMuted
    },
    content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md
    }
});
