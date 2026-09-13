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
