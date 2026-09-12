import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuizHistory } from '../useQuizHistory';
import { getQuizHistory } from '../../api/history.api';
import { QuestionType } from '../../../../shared/types';
import type { Quiz } from '../../../../shared/types';

jest.mock('../../api/history.api', () => ({ getQuizHistory: jest.fn() }));

const getQuizHistoryMock = getQuizHistory as jest.Mock;

const historyQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    completedAt: '2026-01-01T00:00:00.000Z',
    score: 1,
    totalQuestions: 1,
    duration: 30,
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

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
    jest.clearAllMocks();
});

describe('useQuizHistory', () => {
    test('unwraps the { quizzes } envelope', async () => {
        getQuizHistoryMock.mockResolvedValue({ quizzes: [historyQuiz] });

        const { result } = await renderHook(() => useQuizHistory('adalovelace'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getQuizHistoryMock).toHaveBeenCalledWith('adalovelace');
        expect(result.current.data).toEqual([historyQuiz]);
    });

    test('does not fetch when username is empty', async () => {
        const { result } = await renderHook(() => useQuizHistory(''), { wrapper });

        expect(result.current.fetchStatus).toBe('idle');
        expect(getQuizHistoryMock).not.toHaveBeenCalled();
    });
});
