import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Banner } from '../Banner';

describe('Banner', () => {
    test('an error banner is announced as an alert', async () => {
        await render(<Banner message="Invalid username or password" variant="error" testID="login-error-banner" />);

        const banner = screen.getByTestId('login-error-banner');
        expect(banner).toHaveTextContent('Invalid username or password');
        expect(banner.props.accessibilityRole).toBe('alert');
        expect(banner.props.accessibilityLiveRegion).toBe('polite');
    });

    test('a success banner updates the live region without an alert role', async () => {
        await render(<Banner message="Account updated" variant="success" testID="account-success-banner" />);

        const banner = screen.getByTestId('account-success-banner');
        expect(banner).toHaveTextContent('Account updated');
        expect(banner.props.accessibilityRole).toBeUndefined();
        expect(banner.props.accessibilityLiveRegion).toBe('polite');
    });
});
