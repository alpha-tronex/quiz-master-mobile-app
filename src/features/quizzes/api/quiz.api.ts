import { httpClient } from '../../../shared/api/httpClient';
import type { Quiz, QuizSummary } from '../../../shared/types';

/**
 * Raw API calls for the quizzes feature (see MOBILE_APP_ARCHITECTURE.md's
 * `features/<feature>/api` layer), mirroring the Angular app's
 * `questions-service.ts`. Unlike auth, these are all authenticated routes
 * (server/routes/quizRoutes.js's `verifyToken` middleware), so none of them
 * pass `skipAuth` — httpClient attaches the bearer token automatically.
 */
export function getQuizzes(): Promise<QuizSummary[]> {
    return httpClient.get<QuizSummary[]>('/api/quizzes');
}

/**
 * `quizId` is optional — omitting it lets the server fall back to its
 * default quiz (`Number(req.query.id || 0)` in quizRoutes.js), matching
 * `questions-service.ts#getQuiz`.
 */
export function getQuiz(quizId?: number): Promise<Quiz> {
    const path = quizId !== undefined ? `/api/quiz?id=${quizId}` : '/api/quiz';
    return httpClient.get<Quiz>(path);
}

export interface SaveQuizPayload {
    username: string;
    quizData: Quiz;
}

export interface SaveQuizResponse {
    message: string;
    quiz: Quiz;
}

export function saveQuiz(payload: SaveQuizPayload): Promise<SaveQuizResponse> {
    return httpClient.post<SaveQuizResponse>('/api/quiz', payload);
}
