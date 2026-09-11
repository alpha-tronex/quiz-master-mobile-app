import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from '../useLogin';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../../../core/auth/authStore';
import { ApiClientError } from '../../../../shared/api/apiError';
import type { User } from '../../../../shared/types';

jest.mock('../../api/auth.api', () => ({ login: jest.fn() }));

const loginMock = login as jest.Mock;

const testUser: User = {
    id: 'u1',
    fname: 'Ada',
    lname: 'Lovelace',
    email: 'ada@example.com',
    phone: '',
    address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
    uname: 'adalovelace',
    pass: '',
    type: 'student',
    token: 'jwt-abc'
};

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('useLogin', () => {
    test('persists the session in authStore on a successful login', async () => {
        loginMock.mockResolvedValue(testUser);
        const { result } = await renderHook(() => useLogin(), { wrapper });

        result.current.mutate({ uname: 'adalovelace', pass: 'password123' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(loginMock).toHaveBeenCalledWith({ uname: 'adalovelace', pass: 'password123' });
        expect(useAuthStore.getState().token).toBe('jwt-abc');
        expect(useAuthStore.getState().user).toEqual(testUser);
    });

    test('surfaces an ApiClientError from a failed login without touching the session', async () => {
        loginMock.mockRejectedValue(new ApiClientError(401, 'INVALID_CREDENTIALS', 'Invalid username or password'));
        const { result } = await renderHook(() => useLogin(), { wrapper });

        result.current.mutate({ uname: 'adalovelace', pass: 'wrong' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toMatchObject({ code: 'INVALID_CREDENTIALS' });
        expect(useAuthStore.getState().token).toBeNull();
    });

    test('does not persist a session when the response is missing a token', async () => {
        loginMock.mockResolvedValue({ ...testUser, token: undefined });
        const { result } = await renderHook(() => useLogin(), { wrapper });

        result.current.mutate({ uname: 'adalovelace', pass: 'password123' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(useAuthStore.getState().token).toBeNull();
    });
});
