import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteAccount } from '../useDeleteAccount';
import { deleteAccount } from '../../api/account.api';
import { useAuthStore } from '../../../../core/auth/authStore';
import { ApiClientError } from '../../../../shared/api/apiError';
import type { User } from '../../../../shared/types';

jest.mock('../../api/account.api', () => ({ deleteAccount: jest.fn() }));

const deleteAccountMock = deleteAccount as jest.Mock;

const testUser: User = {
    id: 'u1',
    fname: 'Ada',
    lname: 'Lovelace',
    email: 'ada@example.com',
    phone: '',
    address: {
        street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: ''
    },
    uname: 'adalovelace',
    pass: '',
    type: 'student'
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    useAuthStore.setState({ user: testUser, token: 'jwt-abc', isHydrating: false });
});

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('useDeleteAccount', () => {
    test('calls DELETE /api/account and clears the session on success', async () => {
        deleteAccountMock.mockResolvedValue({ message: 'Account deleted successfully' });

        const { result } = await renderHook(() => useDeleteAccount(), { wrapper });

        result.current.mutate();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(deleteAccountMock).toHaveBeenCalledTimes(1);
        expect(useAuthStore.getState().token).toBeNull();
        expect(useAuthStore.getState().user).toBeNull();
    });

    test('leaves the session intact and surfaces an ApiClientError on failure', async () => {
        deleteAccountMock.mockRejectedValue(new ApiClientError(500, 'SERVER_ERROR', 'Something went wrong'));

        const { result } = await renderHook(() => useDeleteAccount(), { wrapper });

        result.current.mutate();

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toMatchObject({ code: 'SERVER_ERROR' });
        expect(useAuthStore.getState().token).toBe('jwt-abc');
        expect(useAuthStore.getState().user).toEqual(testUser);
    });
});
