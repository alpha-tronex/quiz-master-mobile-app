import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCohort } from '../useCohort';
import { getMyCohort } from '../../api/cohort.api';

jest.mock('../../api/cohort.api', () => ({ getMyCohort: jest.fn() }));

const getMyCohortMock = getMyCohort as jest.Mock;

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
    jest.clearAllMocks();
});

describe('useCohort', () => {
    test('unwraps the { name } envelope', async () => {
        getMyCohortMock.mockResolvedValue({ name: 'Fall 2026' });

        const { result } = await renderHook(() => useCohort('adalovelace'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(getMyCohortMock).toHaveBeenCalledTimes(1);
        expect(result.current.data).toBe('Fall 2026');
    });

    test('does not fetch when username is empty', async () => {
        const { result } = await renderHook(() => useCohort(''), { wrapper });

        expect(result.current.fetchStatus).toBe('idle');
        expect(getMyCohortMock).not.toHaveBeenCalled();
    });
});
