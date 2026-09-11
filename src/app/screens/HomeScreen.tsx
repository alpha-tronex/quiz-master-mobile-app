import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../shared/theme';

/**
 * Landing tab for a signed-in user. Lives under app/screens rather than a
 * features/ folder: it has no hooks or API calls of its own (unlike Quizzes,
 * History, Account), it's purely a navigation-shell entry point — see the
 * MainTabs tree in docs/MOBILE_APP_ARCHITECTURE.md.
 */
export function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Quiz Master</Text>
            <Text style={styles.subtitle}>Your dashboard is coming together over the next few phases.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.textMuted,
        textAlign: 'center'
    }
});
