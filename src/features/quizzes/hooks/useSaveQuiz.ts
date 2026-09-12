import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { saveQuiz, SaveQuizPayload, SaveQuizResponse } from '../api/quiz.api';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `POST /api/quiz`. On success, invalidates the saving user's cached
 * quiz history so `HistoryScreen` refetches and shows the newly completed
 * quiz immediately, matching the Angular app's `router.navigate(['/history'])`
 * landing on a freshly-loaded history page.
 */
export function useSaveQuiz(): UseMutationResult<SaveQuizResponse, ApiClientError, SaveQuizPayload> {
    const queryClient = useQueryClient();

    return useMutation<SaveQuizResponse, ApiClientError, SaveQuizPayload>({
        mutationFn: (payload) => saveQuiz(payload),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['quizHistory', variables.username] });
        }
    });
}
