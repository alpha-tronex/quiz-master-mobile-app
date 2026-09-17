import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { InactivityGate } from '../InactivityGate';
import { useInactivityTimeout } from '../useInactivityTimeout';

jest.mock('../useInactivityTimeout', () => ({ useInactivityTimeout: jest.fn() }));

const useInactivityTimeoutMock = useInactivityTimeout as jest.Mock;

afterEach(() => {
    jest.clearAllMocks();
});

describe('InactivityGate', () => {
    test('renders its children', async () => {
        useInactivityTimeoutMock.mockReturnValue({ notifyActivity: jest.fn() });

        await render(
            <InactivityGate>
                <Text>Protected content</Text>
            </InactivityGate>
        );

        expect(screen.getByText('Protected content')).toBeTruthy();
    });

    test('calls notifyActivity() on every touch, without claiming the responder', async () => {
        const notifyActivity = jest.fn();
        useInactivityTimeoutMock.mockReturnValue({ notifyActivity });

        await render(
            <InactivityGate>
                <Text testID="child">Protected content</Text>
            </InactivityGate>
        );

        // Invoked directly rather than via `fireEvent`: RNTL's fireEvent
        // decides whether a touch event is "enabled" by calling
        // onStartShouldSetResponder/onMoveShouldSetResponder first, which
        // this gate deliberately leaves unset (see InactivityGate.tsx) —
        // so simulating a real touch would never reach the capture handler
        // under test here.
        const root = screen.getByTestId('inactivity-gate');
        const claimed = root.props.onStartShouldSetResponderCapture({
            nativeEvent: { touches: [{}] },
            touchHistory: { numberActiveTouches: 1 }
        });

        expect(notifyActivity).toHaveBeenCalledTimes(1);
        // Must return false so it never actually becomes the responder and
        // interferes with a child's own Touchable/ScrollView gestures.
        expect(claimed).toBe(false);
    });
});
