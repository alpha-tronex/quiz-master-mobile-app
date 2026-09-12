import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../../shared/components';
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
            <Text style={styles.title}>Quizzes</Text>

            {quizzesQuery.isPending ? (
                <View style={styles.centered} testID="quiz-list-loading">
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            ) : quizzesQuery.isError ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText} testID="quiz-list-error">
                        {quizzesQuery.error.message}
                    </Text>
                </View>
            ) : quizzesQuery.data.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.subtitle} testID="quiz-list-empty">
                        No quizzes are available right now.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={quizzesQuery.data}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <Pressable
                            testID={`quiz-list-item-${item.id}`}
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
        color: colors.text
    }
});
