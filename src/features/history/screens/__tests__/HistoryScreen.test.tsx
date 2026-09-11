import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HistoryScreen } from '../HistoryScreen';

test('HistoryScreen renders its title', async () => {
    await render(<HistoryScreen />);

    expect(screen.getByText('History')).toBeTruthy();
});
