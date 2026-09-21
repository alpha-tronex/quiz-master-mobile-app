import React from 'react';
import { AppState } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppProviders } from '../AppProviders';
import { onAppStateChange } from '../queryFocusManager';

jest.mock('../queryFocusManager', () => ({ onAppStateChange: jest.fn() }));

afterEach(() => {
    jest.clearAllMocks();
});

describe('AppProviders', () => {
    test('subscribes onAppStateChange to AppState changes on mount', async () => {
        const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');

        await render(<AppProviders>{null}</AppProviders>);

        expect(addEventListenerSpy).toHaveBeenCalledWith('change', onAppStateChange);
    });

    test('removes the AppState subscription on unmount', async () => {
        const removeSpy = jest.fn();
        jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: removeSpy } as unknown as ReturnType<typeof AppState.addEventListener>);

        const { unmount } = await render(<AppProviders>{null}</AppProviders>);
        unmount();

        expect(removeSpy).toHaveBeenCalledTimes(1);
    });
});
