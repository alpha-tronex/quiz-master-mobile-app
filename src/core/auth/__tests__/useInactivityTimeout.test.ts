import { renderHook } from '@testing-library/react-native';
import { useInactivityTimeout, INACTIVITY_TIMEOUT_MS } from '../useInactivityTimeout';
import { useAuthStore } from '../authStore';
import { __clearAll } from 'expo-secure-store';
import type { User } from '../../../shared/types';

const testUser: User = {
    id: 'u1',
    fname: 'Ada',
    lname: 'Lovelace',
    email: 'ada@example.com',
    phone: '',
    address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
    uname: 'adalovelace',
    pass: '',
    type: 'student'
};

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
    __clearAll();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('useInactivityTimeout', () => {
    test('does nothing while there is no session', async () => {
        useAuthStore.setState({ token: null });
        const { result } = await renderHook(() => useInactivityTimeout());

        result.current.notifyActivity();
        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);

        expect(useAuthStore.getState().token).toBeNull();
    });

    test('clears the session after the timeout elapses with no activity', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');
        await renderHook(() => useInactivityTimeout());

        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);

        expect(useAuthStore.getState().token).toBeNull();
    });

    test('does not log out before the full timeout has elapsed', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');
        await renderHook(() => useInactivityTimeout());

        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1);

        expect(useAuthStore.getState().token).toBe('jwt-abc');
    });

    test('notifyActivity() reschedules the timeout instead of letting it fire', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');
        const { result } = await renderHook(() => useInactivityTimeout());

        // Halfway through, a touch resets the clock.
        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS / 2);
        result.current.notifyActivity();
        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS / 2);

        // Only INACTIVITY_TIMEOUT_MS / 2 has elapsed since the last touch.
        expect(useAuthStore.getState().token).toBe('jwt-abc');

        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS / 2);

        expect(useAuthStore.getState().token).toBeNull();
    });

    test('notifyActivity() is a no-op once the session has been cleared', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');
        const { result, rerender } = await renderHook(() => useInactivityTimeout());

        await useAuthStore.getState().clearSession();
        rerender({});
        result.current.notifyActivity();
        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);

        expect(useAuthStore.getState().token).toBeNull();
    });

    test('tears down the pending timeout on unmount, so it never fires late', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');
        const { unmount } = await renderHook(() => useInactivityTimeout());

        unmount();
        // Manually reinstate a session after unmount — if the old timer
        // weren't cleared, it would incorrectly clear this new one too.
        await useAuthStore.getState().setSession(testUser, 'jwt-def');
        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);

        expect(useAuthStore.getState().token).toBe('jwt-def');
    });
});
