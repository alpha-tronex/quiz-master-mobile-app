import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accordion, EmptyState, ErrorState, LoadingState } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { useAuthStore } from '../../../core/auth/authStore';
import { useQuizHistory } from '../hooks/useQuizHistory';
import { formatCompletedAt as formatDate, formatDuration, groupHistoryByQuiz } from '../../../shared/utils/quizStats';
import type { QuizHistoryGroup } from '../../../shared/utils/quizStats';
import type { Quiz } from '../../../shared/types';

/**
 * GET /api/quiz/history/:username, grouped by quiz into a collapsible
 * accordion per quiz — a quiz can have more than one attempt once it's been
 * reopened and retaken (see groupHistoryByQuiz), and a flat list used to
 * show those retakes as repeated, indistinguishable cards. Each accordion
 * header summarizes the latest attempt; expanding it lists every attempt
 * (date, score, duration) for that quiz, most recent first — parity with
 * history.component.html's columns: title, date completed, score, total
 * questions, percentage, time taken.
 */
export function HistoryScreen() {
    const username = useAuthStore((state) => state.user?.uname ?? '');
    const historyQuery = useQuizHistory(username);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    function toggle(id: number) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function attemptSummary(quiz: Quiz) {
        const score = quiz.score ?? 0;
        const total = quiz.totalQuestions ?? 0;
        const percentage = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';
        return {
            scoreLabel: `Score: ${score} / ${total} (${percentage}%)`,
            dateLabel: formatDate(quiz.completedAt),
            durationLabel: `Time taken: ${formatDuration(quiz.duration)}`
        };
    }

    function groupSubtitle(group: QuizHistoryGroup): string {
        const attemptWord = group.attempts.length === 1 ? 'attempt' : 'attempts';
        const { scoreLabel } = attemptSummary(group.attempts[0]);
        return `${group.attempts.length} ${attemptWord} · Latest ${scoreLabel}`;
    }

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
                    data={groupHistoryByQuiz(historyQuery.data)}
                    keyExtractor={(group) => String(group.id)}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item: group }) => {
                        const expanded = expandedIds.has(group.id);
                        const subtitle = groupSubtitle(group);
                        return (
                            <Accordion
                                title={group.title}
                                subtitle={subtitle}
                                expanded={expanded}
                                onToggle={() => toggle(group.id)}
                                testID={`history-group-${group.id}`}
                                accessibilityLabel={`${group.title}, ${subtitle}`}
                            >
                                {group.attempts.map((attempt, index) => {
                                    const { scoreLabel, dateLabel, durationLabel } = attemptSummary(attempt);
                                    return (
                                        <View
                                            key={`${group.id}-${index}`}
                                            style={[styles.attemptRow, index > 0 && styles.attemptRowDivider]}
                                            testID="history-item"
                                            accessible
                                            accessibilityLabel={`Completed ${dateLabel}, ${scoreLabel}, ${durationLabel}`}
                                        >
                                            <Text style={styles.rowText}>{dateLabel}</Text>
                                            <Text style={styles.rowText}>{scoreLabel}</Text>
                                            <Text style={styles.rowText}>{durationLabel}</Text>
                                        </View>
                                    );
                                })}
                            </Accordion>
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
    attemptRow: {
        paddingVertical: spacing.sm
    },
    attemptRowDivider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border
    },
    rowText: {
        fontSize: typography.fontSize.sm,
        color: colors.textMuted
    }
});
