import React from 'react';
import { render, screen } from '@testing-library/react-native';
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
    test('shows a loading state while history is pending', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: true, isError: false });

        await render(<HistoryScreen />);

        expect(screen.getByTestId('history-loading')).toBeTruthy();
    });

    test('shows an error message when history fails to load', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: true, error: { message: 'Network error' } });

        await render(<HistoryScreen />);

        expect(screen.getByTestId('history-error')).toHaveTextContent('Network error');
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
