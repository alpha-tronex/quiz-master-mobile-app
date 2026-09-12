import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginScreen } from '../LoginScreen';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../../../core/auth/authStore';
import { ApiClientError } from '../../../../shared/api/apiError';
import type { AuthStackParamList } from '../../../../app/navigation/AuthStack';

jest.mock('../../api/auth.api', () => ({ login: jest.fn() }));

const loginMock = login as jest.Mock;

type LoginProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function renderLoginScreen(navigateMock: jest.Mock = jest.fn()) {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const navigation = { navigate: navigateMock } as unknown as LoginProps['navigation'];
    const route = {} as LoginProps['route'];

    return render(
        <QueryClientProvider client={queryClient}>
            <LoginScreen navigation={navigation} route={route} />
        </QueryClientProvider>
    );
}

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('LoginScreen', () => {
    test('renders the app name, title, fields, submit button and register link', async () => {
        await renderLoginScreen();

        expect(screen.getByTestId('login-app-name')).toHaveTextContent('Quiz Master');
        expect(screen.getByRole('header', { name: 'Log in' })).toBeTruthy();
        expect(screen.getByTestId('login-uname-input')).toBeTruthy();
        expect(screen.getByTestId('login-pass-input')).toBeTruthy();
        expect(screen.getByTestId('login-submit-button')).toBeTruthy();
        expect(screen.getByTestId('login-register-link')).toBeTruthy();
    });

    test('shows validation errors and does not call login when submitting an empty form', async () => {
        const user = userEvent.setup();
        await renderLoginScreen();

        await user.press(screen.getByTestId('login-submit-button'));

        expect(await screen.findByText('Username is required')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
        expect(loginMock).not.toHaveBeenCalled();
    });

    test('submits trimmed credentials and persists the session on success', async () => {
        loginMock.mockResolvedValue({
            id: 'u1',
            fname: 'Ada',
            lname: 'Lovelace',
            email: '',
            phone: '',
            address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
            uname: 'adalovelace',
            pass: '',
            type: 'student',
            token: 'jwt-abc'
        });
        const user = userEvent.setup();
        await renderLoginScreen();

        await user.type(screen.getByTestId('login-uname-input'), '  adalovelace  ');
        await user.type(screen.getByTestId('login-pass-input'), 'password123');
        await user.press(screen.getByTestId('login-submit-button'));

        await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt-abc'));

        expect(loginMock).toHaveBeenCalledWith({ uname: 'adalovelace', pass: 'password123' });
    });

    test('shows the server error message when login fails', async () => {
        loginMock.mockRejectedValue(new ApiClientError(401, 'INVALID_CREDENTIALS', 'Invalid username or password'));
        const user = userEvent.setup();
        await renderLoginScreen();

        await user.type(screen.getByTestId('login-uname-input'), 'adalovelace');
        await user.type(screen.getByTestId('login-pass-input'), 'wrongpass');
        await user.press(screen.getByTestId('login-submit-button'));

        expect(await screen.findByTestId('login-error-banner')).toHaveTextContent(
            'Invalid username or password'
        );
    });

    test('pressing the register link navigates to Register', async () => {
        const navigateMock = jest.fn();
        const user = userEvent.setup();
        await renderLoginScreen(navigateMock);

        await user.press(screen.getByTestId('login-register-link'));

        expect(navigateMock).toHaveBeenCalledWith('Register');
    });
});
