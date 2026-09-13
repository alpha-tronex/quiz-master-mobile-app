import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { AccountScreen } from '../AccountScreen';
import { useUpdateAccount } from '../../hooks/useUpdateAccount';
import { useStates } from '../../hooks/useStates';
import { useCountries } from '../../hooks/useCountries';
import { useAuthStore } from '../../../../core/auth/authStore';
import type { User } from '../../../../shared/types';

jest.mock('../../hooks/useUpdateAccount', () => ({ useUpdateAccount: jest.fn() }));
jest.mock('../../hooks/useStates', () => ({ useStates: jest.fn() }));
jest.mock('../../hooks/useCountries', () => ({ useCountries: jest.fn() }));

const useUpdateAccountMock = useUpdateAccount as jest.Mock;
const useStatesMock = useStates as jest.Mock;
const useCountriesMock = useCountries as jest.Mock;

const updateAccountMutate = jest.fn();

const testUser: User = {
    id: 'u1',
    fname: 'Ada',
    lname: 'Lovelace',
    email: 'ada@example.com',
    phone: '5551234567',
    address: {
        street1: '123 Analytical Engine Way',
        street2: '',
        street3: '',
        city: 'London',
        state: '',
        zipCode: '',
        country: ''
    },
    uname: 'adalovelace',
    pass: '',
    type: 'student'
};

const states = [
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'New York' }
];
const countries = [{ code: 'US', name: 'United States' }];

beforeEach(() => {
    useUpdateAccountMock.mockReturnValue({ mutate: updateAccountMutate, isPending: false, isError: false });
    useStatesMock.mockReturnValue({ data: states });
    useCountriesMock.mockReturnValue({ data: countries });
    useAuthStore.setState({ user: testUser, token: 'jwt-abc', isHydrating: false });
});

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('AccountScreen', () => {
    test('renders the title and pre-fills every field from the logged-in user', async () => {
        await render(<AccountScreen />);

        expect(screen.getByRole('header', { name: 'Account' })).toBeTruthy();
        expect(screen.getByTestId('account-fname-input').props.value).toBe('Ada');
        expect(screen.getByTestId('account-lname-input').props.value).toBe('Lovelace');
        expect(screen.getByTestId('account-email-input').props.value).toBe('ada@example.com');
        expect(screen.getByTestId('account-phone-input').props.value).toBe('5551234567');
        expect(screen.getByTestId('account-street1-input').props.value).toBe('123 Analytical Engine Way');
        expect(screen.getByTestId('account-city-input').props.value).toBe('London');
    });

    test('shows a validation error and does not save when the email is invalid', async () => {
        const user = userEvent.setup();
        await render(<AccountScreen />);

        await user.clear(screen.getByTestId('account-email-input'));
        await user.type(screen.getByTestId('account-email-input'), 'not-an-email');
        await user.press(screen.getByTestId('account-save-button'));

        expect(await screen.findByText('Invalid email address')).toBeTruthy();
        expect(updateAccountMutate).not.toHaveBeenCalled();
    });

    test('saves a trimmed payload including the selected state/country, and shows a success banner', async () => {
        updateAccountMutate.mockImplementation((_payload, { onSuccess }: { onSuccess: () => void }) => onSuccess());
        const user = userEvent.setup();
        await render(<AccountScreen />);

        await user.press(screen.getByTestId('account-state-select'));
        await user.press(screen.getByTestId('account-state-select-option-CA'));
        await user.press(screen.getByTestId('account-country-select'));
        await user.press(screen.getByTestId('account-country-select-option-US'));

        await user.press(screen.getByTestId('account-save-button'));

        expect(updateAccountMutate).toHaveBeenCalledTimes(1);
        const [payload] = updateAccountMutate.mock.calls[0];
        expect(payload).toMatchObject({
            id: 'u1',
            fname: 'Ada',
            lname: 'Lovelace',
            email: 'ada@example.com',
            phone: '5551234567',
            address: {
                street1: '123 Analytical Engine Way',
                city: 'London',
                state: 'CA',
                country: 'US'
            }
        });
        expect(await screen.findByTestId('account-success-banner')).toHaveTextContent('Account updated');
    });

    test('editing a field after a successful save clears the success banner', async () => {
        updateAccountMutate.mockImplementation((_payload, { onSuccess }: { onSuccess: () => void }) => onSuccess());
        const user = userEvent.setup();
        await render(<AccountScreen />);

        await user.press(screen.getByTestId('account-save-button'));
        expect(await screen.findByTestId('account-success-banner')).toBeTruthy();

        await user.type(screen.getByTestId('account-fname-input'), 'x');

        expect(screen.queryByTestId('account-success-banner')).toBeNull();
    });

    test('shows the server error message when the save fails', async () => {
        useUpdateAccountMock.mockReturnValue({
            mutate: updateAccountMutate,
            isPending: false,
            isError: true,
            error: { message: 'Update failed' }
        });
        await render(<AccountScreen />);

        const errorBanner = screen.getByTestId('account-error-banner');
        expect(errorBanner).toHaveTextContent('Update failed');
        expect(errorBanner.props.accessibilityRole).toBe('alert');
        expect(errorBanner.props.accessibilityLiveRegion).toBe('polite');
    });

    test('pressing Log out clears the session', async () => {
        const user = userEvent.setup();
        await render(<AccountScreen />);

        await user.press(screen.getByTestId('account-logout-button'));

        expect(useAuthStore.getState().token).toBeNull();
        expect(useAuthStore.getState().user).toBeNull();
    });
});
