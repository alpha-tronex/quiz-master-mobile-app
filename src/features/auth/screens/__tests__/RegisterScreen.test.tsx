import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RegisterScreen } from '../RegisterScreen';
import { register } from '../../api/auth.api';
import { useAuthStore } from '../../../../core/auth/authStore';
import { ApiClientError } from '../../../../shared/api/apiError';
import type { AuthStackParamList } from '../../../../app/navigation/AuthStack';

jest.mock('../../api/auth.api', () => ({ register: jest.fn() }));

const registerMock = register as jest.Mock;

type RegisterProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

function renderRegisterScreen(navigateMock: jest.Mock = jest.fn()) {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const navigation = { navigate: navigateMock } as unknown as RegisterProps['navigation'];
    const route = {} as RegisterProps['route'];

    return render(
        <QueryClientProvider client={queryClient}>
            <RegisterScreen navigation={navigation} route={route} />
        </QueryClientProvider>
    );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByTestId('register-fname-input'), 'Grace');
    await user.type(screen.getByTestId('register-lname-input'), 'Hopper');
    await user.type(screen.getByTestId('register-uname-input'), 'gracehopper');
    await user.type(screen.getByTestId('register-email-input'), 'grace@example.com');
    await user.type(screen.getByTestId('register-pass-input'), 'password123');
    await user.type(screen.getByTestId('register-confirm-pass-input'), 'password123');
}

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('RegisterScreen', () => {
    test('renders every field, the submit button and the login link', async () => {
        await renderRegisterScreen();

        expect(screen.getByRole('header', { name: 'Register' })).toBeTruthy();
        expect(screen.getByTestId('register-fname-input')).toBeTruthy();
        expect(screen.getByTestId('register-lname-input')).toBeTruthy();
        expect(screen.getByTestId('register-uname-input')).toBeTruthy();
        expect(screen.getByTestId('register-email-input')).toBeTruthy();
        expect(screen.getByTestId('register-phone-input')).toBeTruthy();
        expect(screen.getByTestId('register-pass-input')).toBeTruthy();
        expect(screen.getByTestId('register-confirm-pass-input')).toBeTruthy();
        expect(screen.getByTestId('register-submit-button')).toBeTruthy();
        expect(screen.getByTestId('register-login-link')).toBeTruthy();
    });

    test('shows validation errors and does not call register when uname/pass are blank', async () => {
        const user = userEvent.setup();
        await renderRegisterScreen();

        await user.press(screen.getByTestId('register-submit-button'));

        expect(await screen.findByText('Username is required')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
        expect(registerMock).not.toHaveBeenCalled();
    });

    test('shows a mismatch error and does not call register when passwords differ', async () => {
        const user = userEvent.setup();
        await renderRegisterScreen();

        await user.type(screen.getByTestId('register-uname-input'), 'gracehopper');
        await user.type(screen.getByTestId('register-pass-input'), 'password123');
        await user.type(screen.getByTestId('register-confirm-pass-input'), 'somethingelse');
        await user.press(screen.getByTestId('register-submit-button'));

        expect(await screen.findByText('Passwords do not match')).toBeTruthy();
        expect(registerMock).not.toHaveBeenCalled();
    });

    test('submits a trimmed payload and persists the session on success', async () => {
        registerMock.mockResolvedValue({
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
        });
        const user = userEvent.setup();
        await renderRegisterScreen();

        await fillValidForm(user);
        await user.press(screen.getByTestId('register-submit-button'));

        await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt-xyz'));

        expect(registerMock).toHaveBeenCalledWith({
            fname: 'Grace',
            lname: 'Hopper',
            uname: 'gracehopper',
            email: 'grace@example.com',
            pass: 'password123',
            phone: ''
        });
    });

    test('shows the server error message when registration fails (e.g. duplicate username)', async () => {
        registerMock.mockRejectedValue(
            new ApiClientError(409, 'DUPLICATE_USER', 'Username or email already in use')
        );
        const user = userEvent.setup();
        await renderRegisterScreen();

        await fillValidForm(user);
        await user.press(screen.getByTestId('register-submit-button'));

        expect(await screen.findByTestId('register-error-banner')).toHaveTextContent(
            'Username or email already in use'
        );
    });

    test('pressing the login link navigates to Login', async () => {
        const navigateMock = jest.fn();
        const user = userEvent.setup();
        await renderRegisterScreen(navigateMock);

        await user.press(screen.getByTestId('register-login-link'));

        expect(navigateMock).toHaveBeenCalledWith('Login');
    });
});
