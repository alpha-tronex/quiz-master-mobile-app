import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuizzes } from '../useQuizzes';
import { getQuizzes } from '../../api/quiz.api';
import { ApiClientError } from '../../../../shared/api/apiError';
import type { QuizSummary } from '../../../../shared/types';

jest.mock('../../api/quiz.api', () => ({ getQuizzes: jest.fn() }));

const getQuizzesMock = getQuizzes as jest.Mock;

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
    jest.clearAllMocks();
});

describe('useQuizzes', () => {
    test('returns the quiz summaries on success', async () => {
        const summaries: QuizSummary[] = [
            { id: 1, title: 'General Knowledge', taken: false, locked: false },
            { id: 2, title: 'Web Basics', taken: false, locked: false }
        ];
        getQuizzesMock.mockResolvedValue(summaries);

        const { result } = await renderHook(() => useQuizzes(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(summaries);
    });

    test('surfaces an ApiClientError on failure', async () => {
        getQuizzesMock.mockRejectedValue(new ApiClientError(500, 'SERVER_ERROR', 'Something went wrong'));

        const { result } = await renderHook(() => useQuizzes(), { wrapper });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toMatchObject({ code: 'SERVER_ERROR' });
    });
});
