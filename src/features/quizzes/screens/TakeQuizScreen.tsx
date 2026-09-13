import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Button, Card } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { useAuthStore } from '../../../core/auth/authStore';
import { useQuiz } from '../hooks/useQuiz';
import { useSaveQuiz } from '../hooks/useSaveQuiz';
import { AnswerOption } from '../components/AnswerOption';
import { QuestionType } from '../../../shared/types';
import type { Question, Quiz } from '../../../shared/types';
import type { QuizzesStackParamList } from '../../../app/navigation/QuizzesStack';
import type { MainTabParamList } from '../../../app/navigation/MainTabs';

type Props = CompositeScreenProps<
    NativeStackScreenProps<QuizzesStackParamList, 'TakeQuiz'>,
    BottomTabScreenProps<MainTabParamList>
>;

/**
 * Answer-selection helper mirroring questions.component.ts's
 * `isQuestionCorrect`: both arrays must be the same length and contain the
 * same values once sorted (order of selection doesn't matter).
 */
function isQuestionCorrect(question: Question): boolean {
    const selection = question.selection ?? [];
    const correct = question.correct ?? [];
    if (selection.length !== correct.length) {
        return false;
    }
    const sortedSelection = [...selection].sort((a, b) => a - b);
    const sortedCorrect = [...correct].sort((a, b) => a - b);
    return sortedSelection.every((value, index) => value === sortedCorrect[index]);
}

/** 1-based answer lookup, matching `getAnswerText` in questions.component.ts. */
function getAnswerText(question: Question, answerNum: number): string {
    if (!question.answers || answerNum < 1 || answerNum > question.answers.length) {
        return '';
    }
    return question.answers[answerNum - 1];
}

/**
 * GET /api/quiz?id= → answer all questions → POST /api/quiz. Ports
 * questions.component.ts's taking → submitted → resultsAccepted state
 * machine: `questions` is a local editable clone of the fetched quiz's
 * questions (so selections don't mutate React Query's cache).
 *
 * The clone is populated the moment `quizQuery.data` first arrives by
 * calling `setQuestions` directly in the render body (React's documented
 * "adjust state while rendering" pattern — see
 * https://react.dev/learn/you-might-not-need-an-effect), rather than in a
 * `useEffect`, since setting state synchronously inside an effect just to
 * mirror data that's already available during render causes an extra,
 * avoidable render pass. `startTimeRef` is seeded separately in an effect
 * because reading the clock is an impure operation that must not run
 * during render.
 */
export function TakeQuizScreen({ route, navigation }: Props) {
    const { quizId } = route.params;
    const quizQuery = useQuiz(quizId);
    const saveQuiz = useSaveQuiz();
    const username = useAuthStore((state) => state.user?.uname ?? '');

    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [resultsAccepted, setResultsAccepted] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const startTimeRef = useRef(0);

    if (quizQuery.data && !questions) {
        setQuestions(quizQuery.data.questions.map((question) => ({ ...question, selection: [] })));
    }

    useEffect(() => {
        if (questions && startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
        }
    }, [questions]);

    function updateCurrentQuestion(updater: (question: Question) => Question) {
        setQuestions((prev) => {
            if (!prev) {
                return prev;
            }
            const next = [...prev];
            next[currentIndex] = updater(next[currentIndex]);
            return next;
        });
    }

    function recordMultiChoiceAnswer(answerNum: number) {
        updateCurrentQuestion((question) => {
            const selection = question.selection ?? [];
            const nextSelection = selection.includes(answerNum)
                ? selection.filter((value) => value !== answerNum)
                : [...selection, answerNum];
            return { ...question, selection: nextSelection };
        });
    }

    function recordSingleAnswer(answerNum: number) {
        updateCurrentQuestion((question) => ({ ...question, selection: [answerNum] }));
    }

    function goPrevious() {
        setCurrentIndex((index) => Math.max(0, index - 1));
    }

    function goNext() {
        setCurrentIndex((index) => (questions ? Math.min(questions.length - 1, index + 1) : index));
    }

    function handleSubmit() {
        if (!questions) {
            return;
        }
        const allAnswered = questions.every((question) => (question.selection?.length ?? 0) > 0);
        if (!allAnswered) {
            return;
        }
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        setSubmitted(true);
    }

    function handleRetake() {
        setQuestions((prev) => prev?.map((question) => ({ ...question, selection: [] })) ?? prev);
        setCurrentIndex(0);
        setSubmitted(false);
        setResultsAccepted(false);
        setElapsedTime(0);
        startTimeRef.current = Date.now();
    }

    function handleAcceptResults() {
        if (resultsAccepted || !questions || !quizQuery.data) {
            return;
        }
        setResultsAccepted(true);

        const quiz = quizQuery.data;
        const score = questions.filter(isQuestionCorrect).length;
        const quizData: Quiz = {
            id: quiz.id,
            title: quiz.title,
            completedAt: new Date(),
            questions: questions.map((question) => ({ ...question, isCorrect: isQuestionCorrect(question) })),
            score,
            totalQuestions: questions.length,
            duration: elapsedTime
        };

        saveQuiz.mutate(
            { username, quizData },
            {
                onSettled: () => {
                    navigation.navigate('History');
                }
            }
        );
    }

    if (quizQuery.isPending) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered} testID="take-quiz-loading">
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    if (quizQuery.isError) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.errorText} testID="take-quiz-error">
                        {quizQuery.error.message}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // `quizQuery.data` has arrived, but the clone effect above hasn't run
    // yet — same one-frame gap that would exist if this were derived state
    // synchronously; a brief loading state keeps the render below fully
    // narrowed to a non-null `questions` array.
    if (!questions) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered} testID="take-quiz-loading">
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    const quiz = quizQuery.data;

    if (questions.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.subtitle}>Please check again later. Thanks.</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (submitted) {
        const score = questions.filter(isQuestionCorrect).length;

        return (
            <SafeAreaView style={styles.safeArea}>
                <ScrollView testID="take-quiz-results-scroll" style={styles.scrollView} contentContainerStyle={styles.content}>
                    <Text style={styles.quizTitle}>Quiz Results</Text>
                    <Text style={styles.quizSubtitle}>{quiz.title}</Text>

                    {questions.map((question, index) => {
                        const correct = isQuestionCorrect(question);
                        return (
                            <Card key={question.questionNum} style={styles.resultCard} testID={`take-quiz-result-${index}`}>
                                <Text style={styles.question}>{`Question ${index + 1}: ${question.question}`}</Text>

                                <Text style={styles.resultLabel}>Your selection(s):</Text>
                                <Text style={styles.resultValue}>
                                    {(question.selection ?? []).map((value) => getAnswerText(question, value)).join(', ') || '—'}
                                </Text>

                                <Text style={styles.resultLabel}>Correct answer(s):</Text>
                                <Text style={styles.resultValue}>
                                    {question.correct.map((value) => getAnswerText(question, value)).join(', ')}
                                </Text>

                                <Text style={[styles.resultStatus, correct ? styles.correct : styles.incorrect]}>
                                    {correct ? '✓ Correct' : '✗ Incorrect'}
                                </Text>
                            </Card>
                        );
                    })}

                    <Text style={styles.scoreSummary} testID="take-quiz-score-summary">
                        {`Score: ${score} / ${questions.length}`}
                    </Text>

                    <View style={styles.actionsRow}>
                        <Button
                            testID="take-quiz-retake-button"
                            label="Retake Quiz"
                            variant="secondary"
                            onPress={handleRetake}
                            disabled={resultsAccepted}
                            style={styles.actionButton}
                        />
                        <Button
                            testID="take-quiz-accept-button"
                            label="Accept Results"
                            onPress={handleAcceptResults}
                            disabled={resultsAccepted}
                            loading={saveQuiz.isPending}
                            style={styles.actionButton}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const curQuestion = questions[currentIndex];
    const allAnswered = questions.every((question) => (question.selection?.length ?? 0) > 0);
    const isMultiChoice = curQuestion.questionType === QuestionType.MultipleChoice;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>

                <Card style={styles.card}>
                    <Text style={styles.question} accessibilityRole="header">
                        {curQuestion.question}
                    </Text>
                    {curQuestion.instructions ? <Text style={styles.instructions}>{curQuestion.instructions}</Text> : null}

                    {curQuestion.answers.map((answer, index) => (
                        <AnswerOption
                            key={index}
                            testID={`answer-option-${index + 1}`}
                            text={answer}
                            selected={(curQuestion.selection ?? []).includes(index + 1)}
                            variant={isMultiChoice ? 'checkbox' : 'radio'}
                            onPress={() => (isMultiChoice ? recordMultiChoiceAnswer(index + 1) : recordSingleAnswer(index + 1))}
                        />
                    ))}

                    <View style={styles.navRow}>
                        <Button
                            testID="take-quiz-previous-button"
                            label="Previous"
                            variant="secondary"
                            onPress={goPrevious}
                            disabled={currentIndex === 0}
                            style={styles.navButton}
                        />
                        <Button
                            testID="take-quiz-submit-button"
                            label="Submit"
                            onPress={handleSubmit}
                            disabled={!allAnswered}
                            style={styles.navButton}
                        />
                        <Button
                            testID="take-quiz-next-button"
                            label="Next"
                            variant="secondary"
                            onPress={goNext}
                            disabled={currentIndex === questions.length - 1}
                            style={styles.navButton}
                        />
                    </View>
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
    scrollView: {
        // Without an explicit flex here the ScrollView sizes itself to its
        // content (like any other View) instead of the SafeAreaView's
        // bounded height, so long results (many questions) render past the
        // bottom of the screen without being scrollable — the Accept/Retake
        // buttons end up unreachable. `flex: 1` gives the ScrollView itself
        // a fixed viewport to scroll within; `contentContainerStyle` below
        // is what actually grows past that height.
        flex: 1
    },
    content: {
        padding: spacing.lg
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
    },
    errorText: {
        fontSize: typography.fontSize.md,
        color: colors.danger,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.textMuted,
        textAlign: 'center'
    },
    quizTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.xs
    },
    quizSubtitle: {
        fontSize: typography.fontSize.md,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.lg
    },
    card: {
        marginTop: spacing.md
    },
    question: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.sm
    },
    instructions: {
        fontSize: typography.fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.md
    },
    navRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg
    },
    navButton: {
        flex: 1
    },
    resultCard: {
        marginBottom: spacing.md
    },
    resultLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginTop: spacing.sm
    },
    resultValue: {
        fontSize: typography.fontSize.md,
        color: colors.text
    },
    resultStatus: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        marginTop: spacing.sm
    },
    correct: {
        color: colors.success
    },
    incorrect: {
        color: colors.danger
    },
    scoreSummary: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        textAlign: 'center',
        marginVertical: spacing.md
    },
    actionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl
    },
    actionButton: {
        flex: 1
    }
});
