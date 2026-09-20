import { httpClient } from '../../../shared/api/httpClient';

export interface CohortResponse {
    name: string;
}

/**
 * Mirrors `questions-service.ts`-style API wrappers. Authenticated route —
 * the server derives the cohort from the JWT, so there's no username/id
 * param here (contrast `history.api.ts#getQuizHistory`). Returns "Guest"
 * for a student with no active cohort membership (App/Play Store testers
 * included — see server/utils/cohortAccess.js).
 */
export function getMyCohort(): Promise<CohortResponse> {
    return httpClient.get<CohortResponse>('/api/cohort/mine');
}
