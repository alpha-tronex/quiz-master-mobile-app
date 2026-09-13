import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getCountries, Country } from '../api/lookups.api';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `GET /api/utils/countries`. Same static-list reasoning as
 * `useStates` — cached indefinitely per session via `staleTime: Infinity`.
 */
export function useCountries(): UseQueryResult<Country[], ApiClientError> {
    return useQuery<Country[], ApiClientError>({
        queryKey: ['countries'],
        queryFn: getCountries,
        staleTime: Infinity
    });
}
