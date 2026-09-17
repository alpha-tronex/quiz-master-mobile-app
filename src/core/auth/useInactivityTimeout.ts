import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from './authStore';
import { logger } from '../logger';

/** 15 minutes, in milliseconds. */
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Logs the user out after `INACTIVITY_TIMEOUT_MS` of no in-app touch
 * activity. Only arms the timer while a session exists (`token !== null`) —
 * there's nothing to time out on the auth stack, and signing in fresh
 * shouldn't inherit a stale timer left over from a previous session.
 *
 * Returns `notifyActivity`, meant to be called on every touch anywhere in
 * the app (see `InactivityGate.tsx`, which wraps `RootNavigator` with a
 * `PanResponder` for exactly this). Each call reschedules the logout
 * `INACTIVITY_TIMEOUT_MS` out from that touch, so only a continuous gap
 * with *no* touches at all triggers it — this is a plain foreground timer,
 * not tied to `AppState`, matching "inactivity" as time since the user's
 * last touch rather than time spent backgrounded.
 */
export function useInactivityTimeout(): { notifyActivity: () => void } {
    const token = useAuthStore((state) => state.token);
    const clearSession = useAuthStore((state) => state.clearSession);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearScheduledLogout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const scheduleLogout = useCallback(() => {
        clearScheduledLogout();
        timeoutRef.current = setTimeout(() => {
            logger.info(`Logging out after ${INACTIVITY_TIMEOUT_MS / 60000} minutes of inactivity`);
            clearSession();
        }, INACTIVITY_TIMEOUT_MS);
    }, [clearScheduledLogout, clearSession]);

    const notifyActivity = useCallback(() => {
        if (token) {
            scheduleLogout();
        }
    }, [scheduleLogout, token]);

    // Arms (or disarms) the timer whenever the session itself changes —
    // e.g. starts the clock right after login, and tears it down on logout
    // so a cleared session can't schedule a second, redundant clearSession().
    useEffect(() => {
        if (token) {
            scheduleLogout();
        } else {
            clearScheduledLogout();
        }
        return clearScheduledLogout;
    }, [token, scheduleLogout, clearScheduledLogout]);

    return { notifyActivity };
}
