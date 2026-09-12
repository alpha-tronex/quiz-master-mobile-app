import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getQuiz } from '../api/quiz.api';
import type { Quiz } from '../../../shared/types';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `GET /api/quiz` (optionally `?id=`) for TakeQuizScreen. Keyed on
 * `quizId` so navigating between quizzes (or the id-less default) doesn't
 * reuse another quiz's cached data.
 */
export function useQuiz(quizId?: number): UseQueryResult<Quiz, ApiClientError> {
    return useQuery<Quiz, ApiClientError>({
        queryKey: ['quiz', quizId ?? 'default'],
        queryFn: () => getQuiz(quizId)
    });
}
