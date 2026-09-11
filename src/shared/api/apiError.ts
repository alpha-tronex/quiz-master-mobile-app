/**
 * Client-side counterpart to server/utils/apiError.js. Thrown by httpClient
 * for every non-2xx response, parsed from the server's unified
 * `{ error: { code, message, details? } }` body (see docs/BACKEND.md), and
 * for network-level failures where there is no response body to parse at
 * all. Callers can always do `catch (err) { if (err instanceof
 * ApiClientError) ... }` regardless of which of those two cases occurred.
 */
export class ApiClientError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;

    constructor(status: number, code: string, message: string, details?: unknown) {
        super(message);
        this.name = 'ApiClientError';
        this.status = status;
        this.code = code;
        this.details = details;
    }

    /** No HTTP response was received at all (offline, DNS failure, timeout, ...). */
    static networkError(cause?: unknown): ApiClientError {
        return new ApiClientError(
            0,
            'NETWORK_ERROR',
            'Unable to reach the server. Check your connection and try again.',
            cause
        );
    }

    /** A response was received but its body wasn't the JSON shape the API contract promises. */
    static invalidResponse(cause?: unknown): ApiClientError {
        return new ApiClientError(0, 'INVALID_RESPONSE', 'The server returned an unexpected response.', cause);
    }
}
