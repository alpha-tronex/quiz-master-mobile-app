import React from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, EmptyState, ErrorState, LoadingState } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { useQuizzes } from '../hooks/useQuizzes';
import type { QuizzesStackParamList } from '../../../app/navigation/QuizzesStack';

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizList'>;

/**
 * GET /api/quizzes via `useQuizzes`, rendered as a tappable list — matching
 * the Angular app's quiz-selection entry point. Tapping a row navigates to
 * `TakeQuiz` with the chosen `quizId`, which fetches the full quiz via
 * `GET /api/quiz?id=`. Wrapped in a top-edge `SafeAreaView` since this
 * screen (like RegisterScreen) renders its own title flush against the top
 * with its stack header hidden — see QuizzesStack.tsx.
 */
export function QuizListScreen({ navigation }: Props) {
    const quizzesQuery = useQuizzes();

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
                    renderItem={({ item }) => (
                        <Pressable
                            testID={`quiz-list-item-${item.id}`}
                            accessibilityRole="button"
                            accessibilityLabel={`${item.title} quiz`}
                            accessibilityHint="Opens this quiz"
                            onPress={() => navigation.navigate('TakeQuiz', { quizId: item.id })}
                        >
                            <Card style={styles.card}>
                                <Text style={styles.quizTitle}>{item.title}</Text>
                            </Card>
                        </Pressable>
                    )}
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
        color: colors.text
    }
});
