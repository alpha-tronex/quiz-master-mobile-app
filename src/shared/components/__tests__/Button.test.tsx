import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { colors } from '../../theme';

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

    test('keeps the label on a single line, shrinking to fit rather than wrapping', async () => {
        await render(<Button label="Previous" onPress={jest.fn()} />);

        const label = screen.getByText('Previous');
        expect(label.props.numberOfLines).toBe(1);
        expect(label.props.adjustsFontSizeToFit).toBe(true);
    });

    // The teal `primary` background only manages ~2.4:1 contrast with white
    // text (below the 4.5:1 AA minimum for the bold label), so the primary
    // variant's label/spinner use the dark `secondary` navy instead — see
    // the WCAG contrast audit in theme.ts.
    test('uses the dark secondary color for the primary variant label (contrast fix)', async () => {
        await render(<Button label="Register" onPress={jest.fn()} variant="primary" />);

        const label = screen.getByText('Register');
        const flatStyle = [label.props.style].flat();
        expect(flatStyle).toEqual(expect.arrayContaining([expect.objectContaining({ color: colors.secondary })]));
    });

    test('uses the darkened primaryText token for the outline variant label', async () => {
        await render(<Button label="Cancel" onPress={jest.fn()} variant="outline" />);

        const label = screen.getByText('Cancel');
        const flatStyle = [label.props.style].flat();
        expect(flatStyle).toEqual(expect.arrayContaining([expect.objectContaining({ color: colors.primaryText })]));
    });
});
