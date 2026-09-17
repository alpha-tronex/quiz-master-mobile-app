import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { useQuizHistory } from '../../../features/history/hooks/useQuizHistory';
import { useAuthStore } from '../../../core/auth/authStore';
import { QuestionType } from '../../../shared/types';
import type { Quiz } from '../../../shared/types';

jest.mock('../../../features/history/hooks/useQuizHistory', () => ({ useQuizHistory: jest.fn() }));

const useQuizHistoryMock = useQuizHistory as jest.Mock;

const question = {
    questionNum: 0,
    questionType: QuestionType.TrueFalse,
    question: 'Is the sky blue?',
    instructions: 'Select the correct answer',
    answers: ['True', 'False'],
    correct: [1]
};

const olderQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    completedAt: '2026-01-01T00:00:00.000Z',
    score: 2,
    totalQuestions: 4,
    duration: 60,
    questions: [question]
};

const latestQuiz: Quiz = {
    id: 2,
    title: 'Islamic History',
    completedAt: '2026-02-01T00:00:00.000Z',
    score: 4,
    totalQuestions: 4,
    duration: 90,
    questions: [question]
};

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('HomeScreen', () => {
    test('shows a loading state while history is pending', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: true, isError: false });

        await render(<HomeScreen />);

        expect(screen.getByTestId('home-loading')).toBeTruthy();
    });

    test('shows an error message when history fails to load', async () => {
        useQuizHistoryMock.mockReturnValue({
            isPending: false,
            isError: true,
            error: { message: 'Network error' },
            refetch: jest.fn(),
            isRefetching: false
        });

        await render(<HomeScreen />);

        expect(screen.getByTestId('home-error')).toHaveTextContent('Network error');
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
        await render(<HomeScreen />);

        await user.press(screen.getByTestId('home-retry-button'));

        expect(refetch).toHaveBeenCalledTimes(1);
    });

    test('shows a generic welcome and an empty state when no quizzes have been completed', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await render(<HomeScreen />);

        expect(screen.getByRole('header', { name: 'Welcome to Quiz Master' })).toBeTruthy();
        expect(screen.getByTestId('home-empty')).toHaveTextContent('Pick a quiz from the Quizzes tab to get started.');
    });

    test('greets a signed-in user by first name', async () => {
        useAuthStore.setState({
            user: {
                id: 'u1',
                fname: 'Ada',
                lname: 'Lovelace',
                email: '',
                phone: '',
                address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
                uname: 'adalovelace',
                pass: '',
                type: 'student'
            },
            token: 'jwt-abc',
            isHydrating: false
        });
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await render(<HomeScreen />);

        expect(screen.getByRole('header', { name: 'Welcome back, Ada!' })).toBeTruthy();
    });

    test('renders quizzes-completed and average-score stat cards', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [olderQuiz, latestQuiz] });

        await render(<HomeScreen />);

        // Each card's testID targets the Card wrapper, whose combined text
        // content concatenates all of its Text children — so these check
        // for substrings ({ exact: false }) rather than an exact match.
        const completed = screen.getByTestId('home-stat-completed');
        expect(completed).toHaveTextContent('2', { exact: false });
        expect(completed).toHaveTextContent('Quizzes Completed', { exact: false });

        // olderQuiz 50% + latestQuiz 100% averages to 75.0%.
        const average = screen.getByTestId('home-stat-average');
        expect(average).toHaveTextContent('75.0%', { exact: false });
        expect(average).toHaveTextContent('Average Score', { exact: false });
    });

    test('renders the most recently completed quiz as the Last Quiz card', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [olderQuiz, latestQuiz] });

        await render(<HomeScreen />);

        const lastQuizCard = screen.getByTestId('home-stat-last-quiz');
        expect(lastQuizCard).toHaveTextContent('Islamic History', { exact: false });
        expect(lastQuizCard).toHaveTextContent('100.0%', { exact: false });
    });

    test('shows a personal-best badge when the last quiz ties or beats every prior score', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [olderQuiz, latestQuiz] });

        await render(<HomeScreen />);

        expect(screen.getByTestId('home-personal-best-badge')).toHaveTextContent('Personal best!');
    });

    test('does not show a personal-best badge when a prior quiz scored higher', async () => {
        const worseLatestQuiz: Quiz = { ...latestQuiz, score: 1 };
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [olderQuiz, worseLatestQuiz] });

        await render(<HomeScreen />);

        expect(screen.queryByTestId('home-personal-best-badge')).toBeNull();
    });

    test('passes the logged-in username to useQuizHistory', async () => {
        useAuthStore.setState({
            user: {
                id: 'u1',
                fname: 'Ada',
                lname: 'Lovelace',
                email: '',
                phone: '',
                address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
                uname: 'adalovelace',
                pass: '',
                type: 'student'
            },
            token: 'jwt-abc',
            isHydrating: false
        });
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await render(<HomeScreen />);

        expect(useQuizHistoryMock).toHaveBeenCalledWith('adalovelace');
    });
});
