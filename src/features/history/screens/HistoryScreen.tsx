import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, EmptyState, ErrorState, LoadingState } from '../../../shared/components';
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
            <Text style={styles.title} accessibilityRole="header">Quiz History</Text>

            {historyQuery.isPending ? (
                <LoadingState testID="history-loading" />
            ) : historyQuery.isError ? (
                <ErrorState
                    message={historyQuery.error.message}
                    testID="history-error"
                    onRetry={() => historyQuery.refetch()}
                    retrying={historyQuery.isRefetching}
                    retryTestID="history-retry-button"
                />
            ) : historyQuery.data.length === 0 ? (
                <EmptyState message="You haven't taken any quizzes yet." testID="history-empty" />
            ) : (
                <FlatList
                    data={historyQuery.data}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const score = item.score ?? 0;
                        const total = item.totalQuestions ?? 0;
                        const percentage = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';

                        const dateLabel = formatDate(item.completedAt);
                        const scoreLabel = `Score: ${score} / ${total} (${percentage}%)`;
                        const durationLabel = `Time taken: ${formatDuration(item.duration)}`;

                        return (
                            <Card
                                style={styles.card}
                                testID="history-item"
                                accessible
                                accessibilityLabel={`${item.title}, completed ${dateLabel}, ${scoreLabel}, ${durationLabel}`}
                            >
                                <Text style={styles.quizTitle}>{item.title}</Text>
                                <Text style={styles.rowText}>{dateLabel}</Text>
                                <Text style={styles.rowText}>{scoreLabel}</Text>
                                <Text style={styles.rowText}>{durationLabel}</Text>
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
