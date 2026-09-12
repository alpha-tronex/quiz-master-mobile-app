import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { useAuthStore } from '../../../core/auth/authStore';
import { useQuizHistory } from '../hooks/useQuizHistory';
import type { Quiz } from '../../../shared/types';

/** Ported from history.component.ts#formatDate: locale date + time string. */
function formatDate(date: Quiz['completedAt']): string {
    if (!date) {
        return '';
    }
    const parsed = new Date(date);
    return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString()}`;
}

/** Ported from history.component.ts#formatDuration. */
function formatDuration(seconds?: number): string {
    if (!seconds || seconds < 0) {
        return 'N/A';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * GET /api/quiz/history/:username, rendered as a card list (a scrollable
 * table doesn't translate well to mobile widths) — parity with
 * history.component.html's columns: title, date completed, score, total
 * questions, percentage, time taken.
 */
export function HistoryScreen() {
    const username = useAuthStore((state) => state.user?.uname ?? '');
    const historyQuery = useQuizHistory(username);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <Text style={styles.title}>Quiz History</Text>

            {historyQuery.isPending ? (
                <View style={styles.centered} testID="history-loading">
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            ) : historyQuery.isError ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText} testID="history-error">
                        {historyQuery.error.message}
                    </Text>
                </View>
            ) : historyQuery.data.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.subtitle} testID="history-empty">
                        You haven&apos;t taken any quizzes yet.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={historyQuery.data}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const score = item.score ?? 0;
                        const total = item.totalQuestions ?? 0;
                        const percentage = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';

                        return (
                            <Card style={styles.card} testID="history-item">
                                <Text style={styles.quizTitle}>{item.title}</Text>
                                <Text style={styles.rowText}>{formatDate(item.completedAt)}</Text>
                                <Text style={styles.rowText}>{`Score: ${score} / ${total} (${percentage}%)`}</Text>
                                <Text style={styles.rowText}>{`Time taken: ${formatDuration(item.duration)}`}</Text>
                            </Card>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        textAlign: 'center',
        paddingTop: spacing.lg,
        paddingBottom: spacing.md
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.textMuted,
        textAlign: 'center'
    },
    errorText: {
        fontSize: typography.fontSize.md,
        color: colors.danger,
        textAlign: 'center'
    },
    listContent: {
        padding: spacing.lg
    },
    card: {
        marginBottom: spacing.md
    },
    quizTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.xs
    },
    rowText: {
        fontSize: typography.fontSize.sm,
        color: colors.textMuted
    }
});
