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
});
