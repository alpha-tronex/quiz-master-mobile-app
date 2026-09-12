import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getQuizHistory } from '../api/history.api';
import type { Quiz } from '../../../shared/types';
import type { ApiClientError } from '../../../shared/api/apiError';

/** Wraps `GET /api/quiz/history/:username`, unwrapping the `{ quizzes }` envelope. */
export function useQuizHistory(username: string): UseQueryResult<Quiz[], ApiClientError> {
    return useQuery<Quiz[], ApiClientError>({
        queryKey: ['quizHistory', username],
        queryFn: async () => {
            const response = await getQuizHistory(username);
            return response.quizzes;
        },
        enabled: username.length > 0
    });
}
