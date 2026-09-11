import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRegister } from '../useRegister';
import { register } from '../../api/auth.api';
import { useAuthStore } from '../../../../core/auth/authStore';
import { ApiClientError } from '../../../../shared/api/apiError';
import type { User } from '../../../../shared/types';

jest.mock('../../api/auth.api', () => ({ register: jest.fn() }));

const registerMock = register as jest.Mock;

const testUser: User = {
    id: 'u2',
    fname: 'Grace',
    lname: 'Hopper',
    email: 'grace@example.com',
    phone: '',
    address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
    uname: 'gracehopper',
    pass: '',
    type: 'student',
    token: 'jwt-xyz'
};

const registerPayload = {
    fname: 'Grace',
    lname: 'Hopper',
    uname: 'gracehopper',
    email: 'grace@example.com',
    pass: 'password123',
    phone: ''
};

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('useRegister', () => {
    test('auto-logs the user in by persisting the session on successful registration', async () => {
        registerMock.mockResolvedValue(testUser);
        const { result } = await renderHook(() => useRegister(), { wrapper });

        result.current.mutate(registerPayload);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(registerMock).toHaveBeenCalledWith(registerPayload);
        expect(useAuthStore.getState().token).toBe('jwt-xyz');
        expect(useAuthStore.getState().user).toEqual(testUser);
    });

    test('surfaces an ApiClientError from a failed registration (e.g. duplicate username)', async () => {
        registerMock.mockRejectedValue(new ApiClientError(409, 'DUPLICATE_USER', 'Username or email already in use'));
        const { result } = await renderHook(() => useRegister(), { wrapper });

        result.current.mutate(registerPayload);

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toMatchObject({ code: 'DUPLICATE_USER' });
        expect(useAuthStore.getState().token).toBeNull();
    });

    test('does not persist a session when the response is missing a token', async () => {
        registerMock.mockResolvedValue({ ...testUser, token: undefined });
        const { result } = await renderHook(() => useRegister(), { wrapper });

        result.current.mutate(registerPayload);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(useAuthStore.getState().token).toBeNull();
    });
});
