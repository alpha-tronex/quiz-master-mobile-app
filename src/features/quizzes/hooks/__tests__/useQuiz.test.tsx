import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuiz } from '../useQuiz';
import { getQuiz } from '../../api/quiz.api';
import { QuestionType } from '../../../../shared/types';
import type { Quiz } from '../../../../shared/types';

jest.mock('../../api/quiz.api', () => ({ getQuiz: jest.fn() }));

const getQuizMock = getQuiz as jest.Mock;

const testQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
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

describe('useQuiz', () => {
    test('fetches the quiz with the given id', async () => {
        getQuizMock.mockResolvedValue(testQuiz);

        const { result } = await renderHook(() => useQuiz(1), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getQuizMock).toHaveBeenCalledWith(1);
        expect(result.current.data).toEqual(testQuiz);
    });

    test('fetches the default quiz when no id is given', async () => {
        getQuizMock.mockResolvedValue(testQuiz);

        const { result } = await renderHook(() => useQuiz(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getQuizMock).toHaveBeenCalledWith(undefined);
    });
});
