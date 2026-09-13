import { httpClient } from '../../../shared/api/httpClient';

export interface State {
    code: string;
    name: string;
}

export interface Country {
    code: string;
    name: string;
}

/**
 * Backs the account-edit form's State/Country dropdowns (see
 * `AccountScreen`). `GET /api/utils/states` and `GET /api/utils/countries`
 * (server/routes/utilRoutes.js) serve static JSON lists — fetched here
 * rather than hand-copied into the mobile app so the dropdown options can
 * never drift from the server's canonical set, mirroring the web app's
 * `UtilService`. Both routes are public (no `verifyToken`), but the caller
 * here is always already authenticated, so the bearer token httpClient
 * attaches is simply ignored server-side.
 */
export function getStates(): Promise<State[]> {
    return httpClient.get<State[]>('/api/utils/states');
}

export function getCountries(): Promise<Country[]> {
    return httpClient.get<Country[]>('/api/utils/countries');
}
