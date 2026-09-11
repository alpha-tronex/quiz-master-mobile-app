import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
    test('renders the label', async () => {
        await render(<Button label="Log in" onPress={jest.fn()} />);

        expect(screen.getByText('Log in')).toBeTruthy();
    });

    test('calls onPress when tapped', async () => {
        const user = userEvent.setup();
        const onPress = jest.fn();
        await render(<Button label="Log in" onPress={onPress} testID="submit" />);

        await user.press(screen.getByTestId('submit'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('does not call onPress when disabled', async () => {
        const user = userEvent.setup();
        const onPress = jest.fn();
        await render(<Button label="Log in" onPress={onPress} disabled testID="submit" />);

        await user.press(screen.getByTestId('submit'));

        expect(onPress).not.toHaveBeenCalled();
    });

    test('does not call onPress while loading, and hides the label', async () => {
        const user = userEvent.setup();
        const onPress = jest.fn();
        await render(<Button label="Log in" onPress={onPress} loading testID="submit" />);

        await user.press(screen.getByTestId('submit'));

        expect(onPress).not.toHaveBeenCalled();
        expect(screen.queryByText('Log in')).toBeNull();
    });

    test('exposes accessibility state reflecting disabled/loading', async () => {
        await render(<Button label="Log in" onPress={jest.fn()} loading testID="submit" />);

        expect(screen.getByTestId('submit').props.accessibilityState).toEqual({
            disabled: true,
            busy: true
        });
    });
});
