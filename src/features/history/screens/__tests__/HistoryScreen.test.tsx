import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { HistoryScreen } from '../HistoryScreen';
import { useQuizHistory } from '../../hooks/useQuizHistory';
import { useAuthStore } from '../../../../core/auth/authStore';
import { QuestionType } from '../../../../shared/types';
import type { Quiz } from '../../../../shared/types';

jest.mock('../../hooks/useQuizHistory', () => ({ useQuizHistory: jest.fn() }));

const useQuizHistoryMock = useQuizHistory as jest.Mock;

const historyQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    completedAt: '2026-01-01T12:00:00.000Z',
    score: 3,
    totalQuestions: 4,
    duration: 95,
    questions: [
        {
            questionNum: 0,
            questionType: QuestionType.TrueFalse,
            question: 'Is the sky blue?',
            instructions: 'Select the correct answer',
            answers: ['True', 'False'],
            correct: [1]
        }
    ]
};

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('HistoryScreen', () => {
    test('renders the title as a header for screen readers', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await render(<HistoryScreen />);

        expect(screen.getByRole('header', { name: 'Quiz History' })).toBeTruthy();
    });

    test('shows a loading state while history is pending', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: true, isError: false });

        await render(<HistoryScreen />);

        expect(screen.getByTestId('history-loading')).toBeTruthy();
    });

    test('shows an error message when history fails to load', async () => {
        useQuizHistoryMock.mockReturnValue({
            isPending: false,
            isError: true,
            error: { message: 'Network error' },
            refetch: jest.fn(),
            isRefetching: false
        });

        await render(<HistoryScreen />);

        expect(screen.getByTestId('history-error')).toHaveTextContent('Network error');
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
        await render(<HistoryScreen />);

        await user.press(screen.getByTestId('history-retry-button'));

        expect(refetch).toHaveBeenCalledTimes(1);
    });

    test('shows an empty state when there are no completed quizzes', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await render(<HistoryScreen />);

        expect(screen.getByTestId('history-empty')).toBeTruthy();
    });

    test('renders a card per completed quiz with score, percentage and duration', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [historyQuiz] });

        await render(<HistoryScreen />);

        expect(screen.getByText('General Knowledge')).toBeTruthy();
        expect(screen.getByText('Score: 3 / 4 (75.0%)')).toBeTruthy();
        expect(screen.getByText('Time taken: 1m 35s')).toBeTruthy();
    });

    test('groups each card into a single accessibility announcement for screen readers', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [historyQuiz] });

        await render(<HistoryScreen />);

        const card = screen.getByTestId('history-item');
        expect(card.props.accessible).toBe(true);
        expect(card.props.accessibilityLabel).toContain('General Knowledge');
        expect(card.props.accessibilityLabel).toContain('Score: 3 / 4 (75.0%)');
        expect(card.props.accessibilityLabel).toContain('Time taken: 1m 35s');
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

        await render(<HistoryScreen />);

        expect(useQuizHistoryMock).toHaveBeenCalledWith('adalovelace');
    });
});
