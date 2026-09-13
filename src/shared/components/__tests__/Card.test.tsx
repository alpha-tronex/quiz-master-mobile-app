import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '../Card';

describe('Card', () => {
    test('renders its children', async () => {
        await render(
            <Card>
                <Text>Quiz title</Text>
            </Card>
        );

        expect(screen.getByText('Quiz title')).toBeTruthy();
    });

    test('applies a testID when provided', async () => {
        await render(
            <Card testID="quiz-card">
                <Text>Quiz title</Text>
            </Card>
        );

        expect(screen.getByTestId('quiz-card')).toBeTruthy();
    });

    test('merges a custom style with the base card style', async () => {
        await render(
            <Card testID="quiz-card" style={{ marginTop: 12 }}>
                <Text>Quiz title</Text>
            </Card>
        );

        const flatStyle = [screen.getByTestId('quiz-card').props.style].flat();
        expect(flatStyle).toEqual(expect.arrayContaining([expect.objectContaining({ marginTop: 12 })]));
    });

    test('forwards accessibility props so screen readers announce the card as one unit', async () => {
        await render(
            <Card
                testID="history-item"
                accessible
                accessibilityLabel="Ada quiz, completed today, Score: 8 / 10 (80.0%)"
                accessibilityHint="Double tap for details"
            >
                <Text>Ada quiz</Text>
            </Card>
        );

        const card = screen.getByTestId('history-item');
        expect(card.props.accessible).toBe(true);
        expect(card.props.accessibilityLabel).toBe('Ada quiz, completed today, Score: 8 / 10 (80.0%)');
        expect(card.props.accessibilityHint).toBe('Double tap for details');
    });
});
