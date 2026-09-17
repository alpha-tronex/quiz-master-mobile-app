import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Badge } from '../Badge';
import { colors } from '../../theme';

describe('Badge', () => {
    test('renders its label', async () => {
        await render(<Badge label="Personal best!" />);

        expect(screen.getByText('Personal best!')).toBeTruthy();
    });

    test('applies a testID when provided', async () => {
        await render(<Badge label="Personal best!" testID="best-badge" />);

        expect(screen.getByTestId('best-badge')).toBeTruthy();
    });

    test('defaults to the neutral variant', async () => {
        await render(<Badge label="New" testID="badge" />);

        const flatStyle = [screen.getByTestId('badge').props.style].flat();
        expect(flatStyle).toEqual(expect.arrayContaining([expect.objectContaining({ backgroundColor: colors.surface })]));
    });

    test('applies success variant styling', async () => {
        await render(<Badge label="Personal best!" variant="success" />);

        const label = screen.getByText('Personal best!');
        const flatStyle = [label.props.style].flat();
        expect(flatStyle).toEqual(expect.arrayContaining([expect.objectContaining({ color: colors.successText })]));
    });

    test('merges a custom style with the base badge style', async () => {
        await render(<Badge label="New" testID="badge" style={{ marginLeft: 8 }} />);

        const flatStyle = [screen.getByTestId('badge').props.style].flat();
        expect(flatStyle).toEqual(expect.arrayContaining([expect.objectContaining({ marginLeft: 8 })]));
    });
});
