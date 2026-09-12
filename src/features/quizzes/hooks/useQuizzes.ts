import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getQuizzes } from '../api/quiz.api';
import type { QuizSummary } from '../../../shared/types';
import type { ApiClientError } from '../../../shared/api/apiError';

/** Wraps `GET /api/quizzes` — the lightweight listing shown on QuizListScreen. */
export function useQuizzes(): UseQueryResult<QuizSummary[], ApiClientError> {
    return useQuery<QuizSummary[], ApiClientError>({
        queryKey: ['quizzes'],
        queryFn: getQuizzes
    });
}
