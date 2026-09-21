import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { saveQuiz, SaveQuizPayload, SaveQuizResponse } from '../api/quiz.api';
import type { ApiClientError } from '../../../shared/api/apiError';

/**
 * Wraps `POST /api/quiz`. On success, invalidates the saving user's cached
 * quiz history so `HistoryScreen` refetches and shows the newly completed
 * quiz immediately, matching the Angular app's `router.navigate(['/history'])`
 * landing on a freshly-loaded history page.
 *
 * Also invalidates the `['quizzes']` list — the taken/locked flags
 * `QuizListScreen` renders from — so a just-submitted quiz stops looking
 * retakeable right away. Without this, the list stayed stale until
 * something else happened to refetch it (foregrounding the app,
 * pull-to-refresh), letting a student navigate back into an already-locked
 * quiz and "retake" it indefinitely in the same session.
 */
export function useSaveQuiz(): UseMutationResult<SaveQuizResponse, ApiClientError, SaveQuizPayload> {
    const queryClient = useQueryClient();

    return useMutation<SaveQuizResponse, ApiClientError, SaveQuizPayload>({
        mutationFn: (payload) => saveQuiz(payload),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['quizHistory', variables.username] });
            void queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        }
    });
}
