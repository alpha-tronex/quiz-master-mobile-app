import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
    test('applies the given testID', async () => {
        await render(<LoadingState testID="quiz-list-loading" />);

        expect(screen.getByTestId('quiz-list-loading')).toBeTruthy();
    });
});
