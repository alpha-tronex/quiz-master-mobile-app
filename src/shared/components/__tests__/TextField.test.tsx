import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { TextField } from '../TextField';

describe('TextField', () => {
    test('renders the label', async () => {
        await render(<TextField label="Username" value="" onChangeText={jest.fn()} />);

        expect(screen.getByText('Username')).toBeTruthy();
    });

    test('renders without a label', async () => {
        await render(<TextField value="" onChangeText={jest.fn()} testID="input" />);

        expect(screen.getByTestId('input')).toBeTruthy();
    });

    test('calls onChangeText as the user types', async () => {
        const user = userEvent.setup();
        const onChangeText = jest.fn();
        await render(<TextField label="Username" value="" onChangeText={onChangeText} testID="input" />);

        await user.type(screen.getByTestId('input'), 'ada');

        expect(onChangeText).toHaveBeenCalled();
        expect(onChangeText.mock.calls.map((call) => call[0]).join('')).toBe('ada');
    });

    test('renders an error message when provided', async () => {
        await render(
            <TextField label="Username" value="ab" onChangeText={jest.fn()} error="Username must be at least 3 characters" />
        );

        expect(screen.getByText('Username must be at least 3 characters')).toBeTruthy();
    });

    test('renders no error message when error is null', async () => {
        await render(<TextField label="Username" value="ada" onChangeText={jest.fn()} error={null} testID="input" />);

        expect(screen.queryByText(/must be at least/)).toBeNull();
    });

    test('forwards standard TextInput props such as secureTextEntry and placeholder', async () => {
        await render(
            <TextField
                label="Password"
                value=""
                onChangeText={jest.fn()}
                secureTextEntry
                placeholder="Enter password"
                testID="input"
            />
        );

        const input = screen.getByTestId('input');
        expect(input.props.secureTextEntry).toBe(true);
        expect(input.props.placeholder).toBe('Enter password');
    });

    test('does not render a visibility toggle unless isPassword is set', async () => {
        await render(<TextField label="Username" value="" onChangeText={jest.fn()} testID="input" />);

        expect(screen.queryByTestId('input-toggle-visibility')).toBeNull();
    });

    test('isPassword hides the value by default and reveals it when the eye icon is pressed', async () => {
        const user = userEvent.setup();
        await render(<TextField label="Password" value="secret123" onChangeText={jest.fn()} isPassword testID="input" />);

        const input = screen.getByTestId('input');
        expect(input.props.secureTextEntry).toBe(true);

        await user.press(screen.getByTestId('input-toggle-visibility'));
        expect(screen.getByTestId('input').props.secureTextEntry).toBe(false);

        await user.press(screen.getByTestId('input-toggle-visibility'));
        expect(screen.getByTestId('input').props.secureTextEntry).toBe(true);
    });
});
