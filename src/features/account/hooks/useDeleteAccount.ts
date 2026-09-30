import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { deleteAccount } from '../api/account.api';
import { useAuthStore } from '../../../core/auth/authStore';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `DELETE /api/account` — the self-service, irreversible account
 * deletion required by App Store Guideline 5.1.1(v). On success, tears down
 * the session via `clearSession()`; `RootNavigator` watches `token` and
 * switches back to the auth stack automatically, so no manual navigation is
 * needed here. There's nothing to invalidate query-wise: the account (and
 * every cache keyed off it) is gone.
 */
export function useDeleteAccount(): UseMutationResult<{ message: string }, ApiClientError, void> {
    const clearSession = useAuthStore((state) => state.clearSession);

    return useMutation<{ message: string }, ApiClientError, void>({
        mutationFn: () => deleteAccount(),
        onSuccess: async () => {
            await clearSession();
        }
    });
}
