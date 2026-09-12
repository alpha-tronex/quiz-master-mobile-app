import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { AnswerOption } from '../AnswerOption';

describe('AnswerOption', () => {
    test('renders the answer text', async () => {
        await render(<AnswerOption text="True" selected={false} onPress={jest.fn()} variant="radio" />);

        expect(screen.getByText('True')).toBeTruthy();
    });

    test('calls onPress when tapped', async () => {
        const onPress = jest.fn();
        const user = userEvent.setup();
        await render(<AnswerOption testID="answer" text="True" selected={false} onPress={onPress} variant="radio" />);

        await user.press(screen.getByTestId('answer'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('exposes checked accessibility state when selected', async () => {
        await render(<AnswerOption testID="answer" text="True" selected onPress={jest.fn()} variant="checkbox" />);

        expect(screen.getByTestId('answer').props.accessibilityState).toMatchObject({ checked: true });
    });

    test('uses the checkbox accessibility role for the checkbox variant', async () => {
        await render(<AnswerOption testID="answer" text="True" selected={false} onPress={jest.fn()} variant="checkbox" />);

        expect(screen.getByTestId('answer').props.accessibilityRole).toBe('checkbox');
    });

    test('uses the radio accessibility role for the radio variant', async () => {
        await render(<AnswerOption testID="answer" text="True" selected={false} onPress={jest.fn()} variant="radio" />);

        expect(screen.getByTestId('answer').props.accessibilityRole).toBe('radio');
    });
});
