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

// A second, more recent attempt of the *same* quiz (id 1) — the case
// groupHistoryByQuiz exists for: a quiz reopened and retaken shows up as a
// second flat entry from the API, and must land inside the same accordion
// rather than as a separate, indistinguishable card.
const retakeAttempt: Quiz = {
    ...historyQuiz,
    completedAt: '2026-02-01T12:00:00.000Z',
    score: 4,
    duration: 50
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

    test('renders a collapsed accordion header per quiz with title and attempt summary', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [historyQuiz] });

        await render(<HistoryScreen />);

        expect(screen.getByText('General Knowledge')).toBeTruthy();
        expect(screen.getByText('1 attempt · Latest Score: 3 / 4 (75.0%)')).toBeTruthy();
        // Attempt detail (date/score/duration rows) isn't shown until expanded.
        expect(screen.queryByTestId('history-item')).toBeNull();
    });

    test('expands to show attempt date, score, and duration when the header is pressed', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [historyQuiz] });
        const user = userEvent.setup();
        await render(<HistoryScreen />);

        await user.press(screen.getByTestId('history-group-1-header'));

        expect(screen.getByText('Score: 3 / 4 (75.0%)')).toBeTruthy();
        expect(screen.getByText('Time taken: 1m 35s')).toBeTruthy();
    });

    test('collapses again when the header is pressed a second time', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [historyQuiz] });
        const user = userEvent.setup();
        await render(<HistoryScreen />);
        const header = screen.getByTestId('history-group-1-header');

        await user.press(header);
        expect(screen.getByTestId('history-item')).toBeTruthy();

        await user.press(header);
        expect(screen.queryByTestId('history-item')).toBeNull();
    });

    test('groups each attempt into a single accessibility announcement for screen readers', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [historyQuiz] });
        const user = userEvent.setup();
        await render(<HistoryScreen />);

        await user.press(screen.getByTestId('history-group-1-header'));

        const attemptRow = screen.getByTestId('history-item');
        expect(attemptRow.props.accessible).toBe(true);
        expect(attemptRow.props.accessibilityLabel).toContain('Score: 3 / 4 (75.0%)');
        expect(attemptRow.props.accessibilityLabel).toContain('Time taken: 1m 35s');
    });

    test('groups multiple attempts of the same quiz under one accordion, most recent first', async () => {
        // historyQuiz (Jan, score 3/4) and retakeAttempt (Feb, score 4/4) share
        // id 1 — the API returns them as two flat entries.
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [historyQuiz, retakeAttempt] });
        const user = userEvent.setup();
        await render(<HistoryScreen />);

        // One accordion, not two — and the header summarizes the latest attempt.
        expect(screen.getAllByText('General Knowledge')).toHaveLength(1);
        expect(screen.getByText('2 attempts · Latest Score: 4 / 4 (100.0%)')).toBeTruthy();

        await user.press(screen.getByTestId('history-group-1-header'));

        const attemptRows = screen.getAllByTestId('history-item');
        expect(attemptRows).toHaveLength(2);
        expect(attemptRows[0].props.accessibilityLabel).toContain('Score: 4 / 4 (100.0%)'); // Feb, most recent
        expect(attemptRows[1].props.accessibilityLabel).toContain('Score: 3 / 4 (75.0%)'); // Jan
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
