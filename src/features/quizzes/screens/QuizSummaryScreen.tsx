import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { useAuthStore } from '../../../core/auth/authStore';
import { useQuizHistory } from '../../history/hooks/useQuizHistory';
import { formatCompletedAt, formatDuration, latestAttemptFor, percentageOf } from '../../../shared/utils/quizStats';
import type { QuizzesStackParamList } from '../../../app/navigation/QuizzesStack';

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizSummary'>;

/**
 * Stats-only view of a quiz the student has already completed — reached by
 * tapping a "taken" row in QuizListScreen. Deliberately not a full
 * per-question review (that's the admin-facing detail level in the Angular
 * app's user-management "Review" modal); a student sees just their score,
 * percentage, completion date, and time taken for their most recent
 * attempt at this quiz (`latestAttemptFor` — a quiz can have more than one
 * attempt once it's been reopened and retaken).
 *
 * `locked` arrives as a route param from QuizListScreen (itself sourced
 * from GET /api/quizzes) rather than being refetched here — when it's
 * `false` (an admin has reopened this quiz), a Retake button hands off to
 * TakeQuizScreen; otherwise a short note explains the quiz is locked.
 */
export function QuizSummaryScreen({ route, navigation }: Props) {
    const { quizId, title, locked } = route.params;
    const username = useAuthStore((state) => state.user?.uname ?? '');
    const historyQuery = useQuizHistory(username);

    if (historyQuery.isPending) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <LoadingState testID="quiz-summary-loading" />
            </SafeAreaView>
        );
    }

    if (historyQuery.isError) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ErrorState
                    message={historyQuery.error.message}
                    testID="quiz-summary-error"
                    onRetry={() => historyQuery.refetch()}
                    retrying={historyQuery.isRefetching}
                    retryTestID="quiz-summary-retry-button"
                />
            </SafeAreaView>
        );
    }

    const attempt = latestAttemptFor(historyQuery.data, quizId);

    if (!attempt) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <EmptyState message="No summary is available for this quiz yet." testID="quiz-summary-empty" />
            </SafeAreaView>
        );
    }

    const percentage = percentageOf(attempt);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                <Text style={styles.title} accessibilityRole="header">{title}</Text>

                <Card style={styles.card} testID="quiz-summary-card">
                    <View style={styles.row}>
                        <Text style={styles.label}>Score</Text>
                        <Text style={styles.value}>{attempt.score ?? 0} / {attempt.totalQuestions ?? 0}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Percentage</Text>
                        <Text style={styles.value}>{percentage.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Completed</Text>
                        <Text style={styles.value}>{formatCompletedAt(attempt.completedAt)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Time Taken</Text>
                        <Text style={styles.value}>{formatDuration(attempt.duration)}</Text>
                    </View>
                </Card>

                {locked ? (
                    <Text style={styles.lockedNote} testID="quiz-summary-locked-note">
                        This quiz is locked. Ask your instructor to reopen it if you'd like to retake it.
                    </Text>
                ) : (
                    <Button
                        label="Retake Quiz"
                        onPress={() => navigation.navigate('TakeQuiz', { quizId })}
                        testID="quiz-summary-retake-button"
                        style={styles.retakeButton}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    container: {
        flex: 1,
        padding: spacing.lg
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.lg
    },
    card: {
        marginBottom: spacing.lg
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm
    },
    label: {
        fontSize: typography.fontSize.md,
        color: colors.textMuted
    },
    value: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text
    },
    lockedNote: {
        fontSize: typography.fontSize.sm,
        color: colors.textMuted,
        textAlign: 'center'
    },
    retakeButton: {
        alignSelf: 'center',
        minWidth: 160
    }
});
