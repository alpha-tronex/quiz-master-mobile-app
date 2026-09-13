import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { updateAccount, UpdateAccountPayload } from '../api/account.api';
import { useAuthStore } from '../../../core/auth/authStore';
import type { User } from '../../../shared/types';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `PUT /api/user/update`. The response has no token (only
 * login/register issue one), so on success this re-persists the session
 * with the *existing* token and the freshly-saved user — keeping
 * `authStore` (and every screen reading `user.fname`, etc.) in sync with
 * the saved profile without forcing a re-login.
 */
export function useUpdateAccount(): UseMutationResult<User, ApiClientError, UpdateAccountPayload> {
    const token = useAuthStore((state) => state.token);
    const setSession = useAuthStore((state) => state.setSession);

    return useMutation<User, ApiClientError, UpdateAccountPayload>({
        mutationFn: (payload) => updateAccount(payload),
        onSuccess: async (user) => {
            if (!token) {
                return;
            }
            await setSession(user, token);
        }
    });
}
