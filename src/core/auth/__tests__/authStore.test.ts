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

afterEach(() => {
    __clearAll();
    useAuthStore.setState({ user: null, token: null, isHydrating: true });
});

describe('authStore', () => {
    test('hydrate() with nothing persisted resolves to a signed-out, non-hydrating state', async () => {
        await useAuthStore.getState().hydrate();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        expect(state.isHydrating).toBe(false);
    });

    test('setSession() updates state immediately and persists to secure storage', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');

        expect(useAuthStore.getState().user).toEqual(testUser);
        expect(useAuthStore.getState().token).toBe('jwt-abc');
    });

    test('hydrate() restores a session that was persisted in a prior app launch', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');

        // Simulate a fresh launch: in-memory state resets, secure storage does not.
        useAuthStore.setState({ user: null, token: null, isHydrating: true });

        await useAuthStore.getState().hydrate();

        const state = useAuthStore.getState();
        expect(state.token).toBe('jwt-abc');
        expect(state.user).toEqual(testUser);
        expect(state.isHydrating).toBe(false);
    });

    test('clearSession() clears in-memory state and removes the persisted session', async () => {
        await useAuthStore.getState().setSession(testUser, 'jwt-abc');

        await useAuthStore.getState().clearSession();

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();

        // Confirm it was actually removed from storage, not just in-memory state.
        useAuthStore.setState({ isHydrating: true });
        await useAuthStore.getState().hydrate();
        expect(useAuthStore.getState().token).toBeNull();
    });
});
