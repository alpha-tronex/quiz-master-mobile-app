import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '../OfflineBanner';

describe('OfflineBanner', () => {
    test('renders the offline message', async () => {
        await render(<OfflineBanner />);

        expect(screen.getByText('No internet connection')).toBeTruthy();
    });

    test('is announced to screen readers as an alert', async () => {
        await render(<OfflineBanner />);

        const banner = screen.getByTestId('offline-banner');
        expect(banner.props.accessibilityRole).toBe('alert');
        expect(banner.props.accessibilityLiveRegion).toBe('polite');
    });
});
