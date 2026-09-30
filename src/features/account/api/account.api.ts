import { httpClient } from '../../../shared/api/httpClient';
import type { Address, User } from '../../../shared/types';

/**
 * `id` is required (the server keys the update off it); every other field
 * is optional — `PUT /api/user/update` (server/routes/authRoutes.js) only
 * validates/persists whichever fields are actually present, so a caller can
 * send just the fields the user changed.
 */
export interface UpdateAccountPayload {
    id: string;
    fname?: string;
    lname?: string;
    email?: string;
    phone?: string;
    address?: Address;
}

/**
 * Wraps `PUT /api/user/update`. Unlike login/register, the response has no
 * `token` field (this isn't a session-issuing call) — see `useUpdateAccount`
 * for how the returned user is folded back into the existing session.
 */
export function updateAccount(payload: UpdateAccountPayload): Promise<User> {
    return httpClient.put<User>('/api/user/update', payload);
}

/**
 * Wraps `DELETE /api/account` (server/routes/authRoutes.js) — the
 * self-service, irreversible hard-delete required by App Store Guideline
 * 5.1.1(v). Scoped server-side to the caller's own id from the JWT, so no
 * id/body is sent here. See `useDeleteAccount` for the session teardown that
 * follows a successful call.
 */
export function deleteAccount(): Promise<{ message: string }> {
    return httpClient.delete<{ message: string }>('/api/account');
}
