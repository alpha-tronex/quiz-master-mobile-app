import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../../shared/types';
import { logger } from '../logger';

/**
 * Session state (current user + token), backed by expo-secure-store
 * (iOS Keychain / Android Keystore) in place of the Angular app's
 * `localStorage.getItem('currentUser')` pattern (see auth.interceptor.ts).
 * `httpClient` reads `token` directly off this store to inject the
 * Authorization header, and clears the session on a 401 response —
 * mirroring the interceptor's clear-and-redirect behavior, except the
 * "redirect" here is implicit: the root navigator (src/app/navigation)
 * switches back to the auth stack whenever `token` becomes null.
 */
const SESSION_KEY = 'qm_session';

interface StoredSession {
    token: string;
    user: User;
}

interface AuthState {
    user: User | null;
    token: string | null;
    /** True until the persisted session has been read from secure storage at launch. */
    isHydrating: boolean;
    /** Reads any persisted session on app launch. Safe to call once, at root mount. */
    hydrate: () => Promise<void>;
    setSession: (user: User, token: string) => Promise<void>;
    clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isHydrating: true,

    hydrate: async () => {
        try {
            const raw = await SecureStore.getItemAsync(SESSION_KEY);
            if (raw) {
                const session: StoredSession = JSON.parse(raw);
                set({ user: session.user, token: session.token, isHydrating: false });
                return;
            }
        } catch (err) {
            logger.error('Failed to restore session from secure storage', err);
        }
        set({ isHydrating: false });
    },

    setSession: async (user, token) => {
        set({ user, token });
        try {
            const session: StoredSession = { user, token };
            await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
        } catch (err) {
            logger.error('Failed to persist session to secure storage', err);
        }
    },

    clearSession: async () => {
        set({ user: null, token: null });
        try {
            await SecureStore.deleteItemAsync(SESSION_KEY);
        } catch (err) {
            logger.error('Failed to clear persisted session', err);
        }
    }
}));
