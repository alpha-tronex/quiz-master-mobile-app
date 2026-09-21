import { Platform } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { onAppStateChange } from '../queryFocusManager';

jest.mock('@tanstack/react-query', () => ({
    focusManager: { setFocused: jest.fn() }
}));

afterEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
});

describe('onAppStateChange', () => {
    test('focuses React Query when the app becomes active', () => {
        onAppStateChange('active');

        expect(focusManager.setFocused).toHaveBeenCalledWith(true);
    });

    test('unfocuses React Query when the app backgrounds', () => {
        onAppStateChange('background');

        expect(focusManager.setFocused).toHaveBeenCalledWith(false);
    });

    test('unfocuses React Query when the app goes inactive', () => {
        onAppStateChange('inactive');

        expect(focusManager.setFocused).toHaveBeenCalledWith(false);
    });

    test('does nothing on web — the browser already manages window focus', () => {
        Platform.OS = 'web';

        onAppStateChange('active');

        expect(focusManager.setFocused).not.toHaveBeenCalled();
    });
});
