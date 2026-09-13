import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Select } from '../Select';

const options = [
    { value: 'CA', label: 'California' },
    { value: 'NY', label: 'New York' }
];

describe('Select', () => {
    test('renders the label and a placeholder when nothing is selected', async () => {
        await render(
            <Select label="State" value="" onValueChange={jest.fn()} options={options} placeholder="Select state" testID="state" />
        );

        expect(screen.getByText('State')).toBeTruthy();
        expect(screen.getByText('Select state')).toBeTruthy();
    });

    test('shows the label of the currently selected option instead of the placeholder', async () => {
        await render(
            <Select label="State" value="NY" onValueChange={jest.fn()} options={options} placeholder="Select state" testID="state" />
        );

        expect(screen.getByText('New York')).toBeTruthy();
    });

    test('opens the option list when pressed, and calls onValueChange when an option is tapped', async () => {
        const user = userEvent.setup();
        const onValueChange = jest.fn();
        await render(
            <Select label="State" value="" onValueChange={onValueChange} options={options} testID="state" />
        );

        await user.press(screen.getByTestId('state'));
        await user.press(screen.getByTestId('state-option-CA'));

        expect(onValueChange).toHaveBeenCalledWith('CA');
    });

    test('renders an error message when provided', async () => {
        await render(
            <Select label="State" value="" onValueChange={jest.fn()} options={options} error="State is required" testID="state" />
        );

        expect(screen.getByText('State is required')).toBeTruthy();
    });
});
