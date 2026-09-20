import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getMyCohort } from '../api/cohort.api';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `GET /api/cohort/mine`, unwrapping the `{ name }` envelope.
 * `username` isn't sent to the server (the route reads the JWT instead) —
 * it's only here to gate `enabled` and key the query per signed-in user,
 * mirroring `useQuizHistory`'s signature so HomeScreen can call both the
 * same way.
 */
export function useCohort(username: string): UseQueryResult<string, ApiClientError> {
    return useQuery<string, ApiClientError>({
        queryKey: ['cohort', username],
        queryFn: async () => {
            const response = await getMyCohort();
            return response.name;
        },
        enabled: username.length > 0
    });
}
