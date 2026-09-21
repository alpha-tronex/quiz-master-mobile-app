import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { useQuizzes } from '../hooks/useQuizzes';
import type { QuizzesStackParamList } from '../../../app/navigation/QuizzesStack';
import type { QuizSummary } from '../../../shared/types';

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizList'>;

/**
 * GET /api/quizzes via `useQuizzes`, rendered as a tappable list — matching
 * the Angular app's quiz-selection entry point. A quiz that's never been
 * taken navigates to `TakeQuiz`, which fetches the full quiz via
 * `GET /api/quiz?id=`. A quiz that has been taken (`item.taken`) instead
 * navigates to `QuizSummary` — retaking happens from there once an admin
 * has reopened it (`!item.locked`), rather than straight from this list.
 * Wrapped in a top-edge `SafeAreaView` since this screen (like
 * RegisterScreen) renders its own title flush against the top with its
 * stack header hidden — see QuizzesStack.tsx.
 */
export function QuizListScreen({ navigation }: Props) {
    const quizzesQuery = useQuizzes();

    function statusLabel(item: QuizSummary): string | null {
        if (!item.taken) {
            return null;
        }
        return item.locked ? 'Taken' : 'Taken — reopened';
    }

    function onPressQuiz(item: QuizSummary) {
        if (item.taken) {
            navigation.navigate('QuizSummary', { quizId: item.id, title: item.title, locked: item.locked });
        } else {
            navigation.navigate('TakeQuiz', { quizId: item.id });
        }
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <Text style={styles.title} accessibilityRole="header">Quizzes</Text>

            {quizzesQuery.isPending ? (
                <LoadingState testID="quiz-list-loading" />
            ) : quizzesQuery.isError ? (
                <ErrorState
                    message={quizzesQuery.error.message}
                    testID="quiz-list-error"
                    onRetry={() => quizzesQuery.refetch()}
                    retrying={quizzesQuery.isRefetching}
                    retryTestID="quiz-list-retry-button"
                />
            ) : quizzesQuery.data.length === 0 ? (
                <EmptyState message="No quizzes are available right now." testID="quiz-list-empty" />
            ) : (
                <FlatList
                    data={quizzesQuery.data}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            testID="quiz-list-refresh-control"
                            refreshing={quizzesQuery.isRefetching}
                            onRefresh={() => quizzesQuery.refetch()}
                            tintColor={colors.primary}
                        />
                    }
                    renderItem={({ item }) => {
                        const label = statusLabel(item);
                        return (
                            <Pressable
                                testID={`quiz-list-item-${item.id}`}
                                accessibilityRole="button"
                                accessibilityLabel={`${item.title} quiz${item.taken ? ', taken' : ''}`}
                                accessibilityHint={item.taken ? 'Opens this quiz’s summary' : 'Opens this quiz'}
                                onPress={() => onPressQuiz(item)}
                            >
                                <Card style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.quizTitle}>{item.title}</Text>
                                        {label ? (
                                            <Badge
                                                label={label}
                                                variant={item.locked ? 'neutral' : 'info'}
                                                testID={`quiz-list-item-${item.id}-status`}
                                            />
                                        ) : null}
                                    </View>
                                </Card>
                            </Pressable>
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    quizTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text
    }
});
