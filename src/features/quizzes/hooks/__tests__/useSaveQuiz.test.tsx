import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSaveQuiz } from '../useSaveQuiz';
import { saveQuiz } from '../../api/quiz.api';
import { ApiClientError } from '../../../../shared/api/apiError';
import { QuestionType } from '../../../../shared/types';
import type { Quiz } from '../../../../shared/types';

jest.mock('../../api/quiz.api', () => ({ saveQuiz: jest.fn() }));

const saveQuizMock = saveQuiz as jest.Mock;

const completedQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    completedAt: new Date('2026-01-01'),
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
            correct: [1],
            selection: [1],
            isCorrect: true
        }
    ]
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('useSaveQuiz', () => {
    test('posts the username and quizData and invalidates that user\'s history cache on success', async () => {
        saveQuizMock.mockResolvedValue({ message: 'Quiz saved successfully', quiz: completedQuiz });
        const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

        const { result } = await renderHook(() => useSaveQuiz(), { wrapper });

        result.current.mutate({ username: 'adalovelace', quizData: completedQuiz });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(saveQuizMock).toHaveBeenCalledWith({ username: 'adalovelace', quizData: completedQuiz });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['quizHistory', 'adalovelace'] });
    });

    test('surfaces an ApiClientError on failure', async () => {
        saveQuizMock.mockRejectedValue(new ApiClientError(500, 'SERVER_ERROR', 'Something went wrong'));

        const { result } = await renderHook(() => useSaveQuiz(), { wrapper });

        result.current.mutate({ username: 'adalovelace', quizData: completedQuiz });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toMatchObject({ code: 'SERVER_ERROR' });
    });
});
