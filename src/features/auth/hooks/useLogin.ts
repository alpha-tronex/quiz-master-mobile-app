import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { login, LoginPayload } from '../api/auth.api';
import { useAuthStore } from '../../../core/auth/authStore';
import { logger } from '../../../core/logger';
import type { User } from '../../../shared/types';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `POST /api/login`. On success, persists the session via
 * `authStore.setSession` — `RootNavigator` then switches from `AuthStack`
 * to `MainTabs` on its own (it renders off `authStore`'s `token`), so
 * callers don't navigate manually. This replaces the Angular app's
 * imperative `router.navigate(['home'])` (`login.component.ts`) with the
 * declarative "navigation follows auth state" pattern already established
 * in `RootNavigator`.
 *
 * Field-level validation (username/password format) is the caller's
 * responsibility, same as the Angular login component — this hook only
 * handles the network call and session side effect.
 */
export function useLogin(): UseMutationResult<User, ApiClientError, LoginPayload> {
    const setSession = useAuthStore((state) => state.setSession);

    return useMutation<User, ApiClientError, LoginPayload>({
        // Wrapped (not passed by reference) so `login()` is called with just
        // the payload — React Query v5 invokes `mutationFn(variables, context)`,
        // and forwarding that second arg would leak internal QueryClient/
        // mutationKey details into the API layer's call signature.
        mutationFn: (payload) => login(payload),
        onSuccess: async (user) => {
            if (!user.token) {
                // Contract violation: server response should always include a
                // token on a successful login (see server/routes/authRoutes.js).
                // Log and bail rather than silently signing the user in with no
                // token, which would just fail on the very next request.
                logger.error('Login response did not include a token', user);
                return;
            }
            await setSession(user, user.token);
        }
    });
}
