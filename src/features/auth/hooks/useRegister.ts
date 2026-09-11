import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { register, RegisterPayload } from '../api/auth.api';
import { useAuthStore } from '../../../core/auth/authStore';
import { logger } from '../../../core/logger';
import type { User } from '../../../shared/types';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `POST /api/register`. Mirrors `useLogin`: registration also returns
 * a token (see `server/routes/authRoutes.js`), so a successful register
 * auto-logs the user in — matching the Angular app's register component,
 * which also lands the user on `home` immediately after registering rather
 * than sending them back to a login form.
 */
export function useRegister(): UseMutationResult<User, ApiClientError, RegisterPayload> {
    const setSession = useAuthStore((state) => state.setSession);

    return useMutation<User, ApiClientError, RegisterPayload>({
        // Wrapped (not passed by reference) so `register()` is called with just
        // the payload — React Query v5 invokes `mutationFn(variables, context)`,
        // and forwarding that second arg would leak internal QueryClient/
        // mutationKey details into the API layer's call signature.
        mutationFn: (payload) => register(payload),
        onSuccess: async (user) => {
            if (!user.token) {
                logger.error('Register response did not include a token', user);
                return;
            }
            await setSession(user, user.token);
        }
    });
}
