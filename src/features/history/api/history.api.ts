import { httpClient } from '../../../shared/api/httpClient';
import type { Quiz } from '../../../shared/types';

export interface QuizHistoryResponse {
    quizzes: Quiz[];
}

/** Mirrors `questions-service.ts#getQuizHistory`. Authenticated route. */
export function getQuizHistory(username: string): Promise<QuizHistoryResponse> {
    return httpClient.get<QuizHistoryResponse>(`/api/quiz/history/${encodeURIComponent(username)}`);
}
