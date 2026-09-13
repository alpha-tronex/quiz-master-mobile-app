import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getStates, State } from '../api/lookups.api';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `GET /api/utils/states`. A static server-side list that never
 * changes without a redeploy, so `staleTime: Infinity` avoids a wasted
 * refetch every time the Account screen remounts within a session.
 */
export function useStates(): UseQueryResult<State[], ApiClientError> {
    return useQuery<State[], ApiClientError>({
        queryKey: ['states'],
        queryFn: getStates,
        staleTime: Infinity
    });
}
