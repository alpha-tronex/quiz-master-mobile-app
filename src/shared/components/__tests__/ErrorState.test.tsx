import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
    test('renders the message under the given testID', async () => {
        await render(<ErrorState message="Network error" testID="quiz-list-error" />);

        expect(screen.getByTestId('quiz-list-error')).toHaveTextContent('Network error');
    });

    test('renders no Retry button when onRetry is omitted', async () => {
        await render(<ErrorState message="Network error" testID="quiz-list-error" />);

        expect(screen.queryByRole('button')).toBeNull();
    });

    test('calls onRetry when the Retry button is pressed', async () => {
        const onRetry = jest.fn();
        const user = userEvent.setup();
        await render(
            <ErrorState message="Network error" onRetry={onRetry} retryTestID="quiz-list-retry-button" />
        );

        await user.press(screen.getByTestId('quiz-list-retry-button'));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    test('shows the Retry button as loading while retrying', async () => {
        await render(
            <ErrorState message="Network error" onRetry={jest.fn()} retrying retryTestID="quiz-list-retry-button" />
        );

        expect(screen.getByTestId('quiz-list-retry-button').props.accessibilityState).toMatchObject({ busy: true });
    });
});
