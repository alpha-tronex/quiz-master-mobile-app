import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
    test('renders the message under the given testID', async () => {
        await render(<EmptyState message="No quizzes are available right now." testID="quiz-list-empty" />);

        expect(screen.getByTestId('quiz-list-empty')).toHaveTextContent('No quizzes are available right now.');
    });
});
