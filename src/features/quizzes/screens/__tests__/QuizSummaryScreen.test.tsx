import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { QuizSummaryScreen } from '../QuizSummaryScreen';
import { useQuizHistory } from '../../../history/hooks/useQuizHistory';
import { QuestionType } from '../../../../shared/types';
import type { Quiz } from '../../../../shared/types';
import type { QuizzesStackParamList } from '../../../../app/navigation/QuizzesStack';

jest.mock('../../../history/hooks/useQuizHistory', () => ({ useQuizHistory: jest.fn() }));

const useQuizHistoryMock = useQuizHistory as jest.Mock;

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizSummary'>;

const question = {
    questionNum: 0,
    questionType: QuestionType.TrueFalse,
    question: 'Is the sky blue?',
    instructions: 'Select the correct answer',
    answers: ['True', 'False'],
    correct: [1]
};

const olderAttempt: Quiz = {
    id: 5,
    title: 'Fiqh Basics',
    completedAt: '2026-01-01T00:00:00.000Z',
    score: 2,
    totalQuestions: 4,
    duration: 60,
    questions: [question]
};

const latestAttempt: Quiz = {
    id: 5,
    title: 'Fiqh Basics',
    completedAt: '2026-02-01T12:00:00.000Z',
    score: 3,
    totalQuestions: 4,
    duration: 95,
    questions: [question]
};

function renderScreen(params: Props['route']['params'], navigateMock: jest.Mock = jest.fn()) {
    const navigation = { navigate: navigateMock } as unknown as Props['navigation'];
    const route = { params } as Props['route'];
    return render(<QuizSummaryScreen navigation={navigation} route={route} />);
}

afterEach(() => {
    jest.clearAllMocks();
});

describe('QuizSummaryScreen', () => {
    test('shows a loading state while history is pending', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: true, isError: false });

        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: true });

        expect(screen.getByTestId('quiz-summary-loading')).toBeTruthy();
    });

    test('shows an error message when history fails to load', async () => {
        useQuizHistoryMock.mockReturnValue({
            isPending: false,
            isError: true,
            error: { message: 'Network error' },
            refetch: jest.fn(),
            isRefetching: false
        });

        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: true });

        expect(screen.getByTestId('quiz-summary-error')).toHaveTextContent('Network error');
    });

    test('retries the query when Retry is pressed on the error state', async () => {
        const refetch = jest.fn();
        useQuizHistoryMock.mockReturnValue({
            isPending: false,
            isError: true,
            error: { message: 'Network error' },
            refetch,
            isRefetching: false
        });
        const user = userEvent.setup();
        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: true });

        await user.press(screen.getByTestId('quiz-summary-retry-button'));

        expect(refetch).toHaveBeenCalledTimes(1);
    });

    test('shows an empty state when there is no attempt on record for this quiz', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: true });

        expect(screen.getByTestId('quiz-summary-empty')).toBeTruthy();
    });

    test('summarizes the most recent attempt for this quiz: score, percentage, date, duration', async () => {
        useQuizHistoryMock.mockReturnValue({
            isPending: false,
            isError: false,
            data: [olderAttempt, latestAttempt]
        });

        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: true });

        const card = screen.getByTestId('quiz-summary-card');
        expect(card).toHaveTextContent('3', { exact: false });
        expect(card).toHaveTextContent('4', { exact: false });
        expect(card).toHaveTextContent('75.0%', { exact: false });
        expect(card).toHaveTextContent('1m 35s', { exact: false });
    });

    test('does not show a full per-question review', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [latestAttempt] });

        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: true });

        expect(screen.queryByText('Is the sky blue?')).toBeNull();
    });

    test('shows a locked note instead of a Retake button when locked', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [latestAttempt] });

        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: true });

        expect(screen.getByTestId('quiz-summary-locked-note')).toBeTruthy();
        expect(screen.queryByTestId('quiz-summary-retake-button')).toBeNull();
    });

    test('shows a Retake button that navigates to TakeQuiz when unlocked', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [latestAttempt] });
        const navigateMock = jest.fn();
        const user = userEvent.setup();
        await renderScreen({ quizId: 5, title: 'Fiqh Basics', locked: false }, navigateMock);

        expect(screen.queryByTestId('quiz-summary-locked-note')).toBeNull();
        await user.press(screen.getByTestId('quiz-summary-retake-button'));

        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('TakeQuiz', { quizId: 5 }));
    });
});
