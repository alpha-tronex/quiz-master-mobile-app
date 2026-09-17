import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../core/auth/authStore';
import { useQuizHistory } from '../../features/history/hooks/useQuizHistory';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { colors, spacing, typography } from '../../shared/theme';
import type { Quiz } from '../../shared/types';

/** Score as a 0-100 percentage; a quiz with no questions scores 0, not NaN. */
function percentageOf(quiz: Quiz): number {
    const total = quiz.totalQuestions ?? 0;
    const score = quiz.score ?? 0;
    return total > 0 ? (score / total) * 100 : 0;
}

/** Most recently completed quiz, by `completedAt`; falls back to array order if undated. */
function mostRecent(quizzes: Quiz[]): Quiz {
    return quizzes.reduce((latest, quiz) => {
        const latestTime = latest.completedAt ? new Date(latest.completedAt).getTime() : 0;
        const quizTime = quiz.completedAt ? new Date(quiz.completedAt).getTime() : 0;
        return quizTime > latestTime ? quiz : latest;
    }, quizzes[0]);
}

/**
 * Landing tab for a signed-in user. Summarizes `GET /api/quiz/history/:username`
 * (the same data HistoryScreen lists in full) as three at-a-glance stat
 * cards, so a returning user sees their standing before picking a quiz
 * rather than needing a tab switch to History for a total or an average —
 * see MainTabs.tsx for where this sits in the tab tree.
 *
 * Wrapped in a top-edge-only `SafeAreaView` (matching HistoryScreen,
 * QuizListScreen, etc.) so the title clears the status bar/notch instead
 * of sitting underneath it — the tab bar already handles the bottom edge.
 */
export function HomeScreen() {
    const fname = useAuthStore((state) => state.user?.fname);
    const username = useAuthStore((state) => state.user?.uname ?? '');
    const historyQuery = useQuizHistory(username);

    const greeting = fname ? `Welcome back, ${fname}!` : 'Welcome to Quiz Master';

    if (historyQuery.isPending) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <LoadingState testID="home-loading" />
            </SafeAreaView>
        );
    }

    if (historyQuery.isError) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ErrorState
                    message={historyQuery.error.message}
                    testID="home-error"
                    onRetry={() => historyQuery.refetch()}
                    retrying={historyQuery.isRefetching}
                    retryTestID="home-retry-button"
                />
            </SafeAreaView>
        );
    }

    const quizzes = historyQuery.data;

    if (quizzes.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.container}>
                    <Text style={styles.title} accessibilityRole="header">{greeting}</Text>
                    <EmptyState message="Pick a quiz from the Quizzes tab to get started." testID="home-empty" />
                </View>
            </SafeAreaView>
        );
    }

    const totalCompleted = quizzes.length;
    const averagePercentage = quizzes.reduce((sum, quiz) => sum + percentageOf(quiz), 0) / totalCompleted;
    const lastQuiz = mostRecent(quizzes);
    const lastQuizPercentage = percentageOf(lastQuiz);
    const bestPercentage = Math.max(...quizzes.map(percentageOf));
    // Ties count as a (repeat) personal best too, not just a strict new high.
    const isPersonalBest = lastQuizPercentage >= bestPercentage;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title} accessibilityRole="header">{greeting}</Text>

                <Card
                    style={styles.card}
                    testID="home-stat-completed"
                    accessible
                    accessibilityLabel={`${totalCompleted} quizzes completed`}
                >
                    <Text style={styles.statValue}>{totalCompleted}</Text>
                    <Text style={styles.statLabel}>Quizzes Completed</Text>
                </Card>

                <Card
                    style={styles.card}
                    testID="home-stat-average"
                    accessible
                    accessibilityLabel={`${averagePercentage.toFixed(1)} percent average score`}
                >
                    <Text style={styles.statValue}>{averagePercentage.toFixed(1)}%</Text>
                    <Text style={styles.statLabel}>Average Score</Text>
                </Card>

                <Card
                    style={styles.card}
                    testID="home-stat-last-quiz"
                    accessible
                    accessibilityLabel={`Last quiz: ${lastQuiz.title}, ${lastQuizPercentage.toFixed(1)} percent${
                        isPersonalBest ? ', personal best' : ''
                    }`}
                >
                    <View style={styles.lastQuizHeader}>
                        <Text style={styles.statLabel}>Last Quiz</Text>
                        {isPersonalBest ? (
                            <Badge label="Personal best!" variant="success" testID="home-personal-best-badge" />
                        ) : null}
                    </View>
                    <Text style={styles.quizTitle}>{lastQuiz.title}</Text>
                    <Text style={styles.statValue}>{lastQuizPercentage.toFixed(1)}%</Text>
                </Card>
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center'
    },
    card: {
        marginBottom: spacing.md
    },
    statValue: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text
    },
    statLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.xs
    },
    lastQuizHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    quizTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.xs
    }
});
