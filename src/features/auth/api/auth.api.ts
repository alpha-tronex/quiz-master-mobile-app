import { httpClient } from '../../../shared/api/httpClient';
import type { User } from '../../../shared/types';

export interface LoginPayload {
    uname: string;
    pass: string;
}

/**
 * Registration fields accepted by the mobile app. The backend's
 * `/api/register` also accepts an `address` object (validating
 * `address.zipCode` if present), but never persists it — `POST
 * /api/register` builds the new `User` document without an `address` field
 * at all (see `server/routes/authRoutes.js`). Address is only ever saved
 * via `PUT /api/user/update` (Phase 4), so it's deliberately omitted from
 * the registration form here rather than collecting data the server would
 * silently discard.
 */
export interface RegisterPayload {
    fname: string;
    lname: string;
    uname: string;
    email: string;
    pass: string;
    phone: string;
}

/**
 * Raw API calls for the auth feature (see MOBILE_APP_ARCHITECTURE.md's
 * `features/auth/api` layer). Both use `skipAuth: true` — httpClient's
 * `RequestOptions` doc explains why: a 401 here means "wrong credentials",
 * not "session expired", so it must not trigger the auto-clear-session
 * behavior that authenticated requests get on 401.
 */
export function login(payload: LoginPayload): Promise<User> {
    return httpClient.post<User>('/api/login', payload, { skipAuth: true });
}

export function register(payload: RegisterPayload): Promise<User> {
    return httpClient.post<User>('/api/register', payload, { skipAuth: true });
}
