import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { AccountScreen } from '../AccountScreen';
import { useAuthStore } from '../../../../core/auth/authStore';
import type { User } from '../../../../shared/types';

const testUser: User = {
    id: 'u1',
    fname: 'Ada',
    lname: 'Lovelace',
    email: 'ada@example.com',
    phone: '',
    address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
    uname: 'adalovelace',
    pass: '',
    type: 'student'
};

afterEach(() => {
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

test('AccountScreen renders its title', async () => {
    await render(<AccountScreen />);

    expect(screen.getByText('Account')).toBeTruthy();
});

test('pressing Log out clears the session', async () => {
    useAuthStore.setState({ user: testUser, token: 'jwt-abc', isHydrating: false });
    const user = userEvent.setup();
    await render(<AccountScreen />);

    await user.press(screen.getByTestId('account-logout-button'));

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
});
