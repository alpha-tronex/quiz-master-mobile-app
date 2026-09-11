import { API_BASE_URL } from '../../core/config';
import { useAuthStore } from '../../core/auth/authStore';
import { logger } from '../../core/logger';
import { ApiClientError } from './apiError';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
    method?: HttpMethod;
    body?: unknown;
    /**
     * Skip attaching the Authorization header and skip the auto-clear-session
     * behavior on 401. Use for the login/register calls themselves, where a
     * 401 means "wrong credentials", not "session expired".
     */
    skipAuth?: boolean;
    signal?: AbortSignal;
}

interface ServerErrorBody {
    error?: {
        code?: string;
        message?: string;
        details?: unknown;
    };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, skipAuth = false, signal } = options;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    if (!skipAuth) {
        const { token } = useAuthStore.getState();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal
        });
    } catch (err) {
        logger.error(`Network request failed: ${method} ${path}`, err);
        throw ApiClientError.networkError(err);
    }

    const rawText = await response.text();
    let payload: unknown = null;
    if (rawText) {
        try {
            payload = JSON.parse(rawText);
        } catch (err) {
            if (response.ok) {
                throw ApiClientError.invalidResponse(err);
            }
            // Non-OK with an unparsable body: fall through and raise a
            // status-based error below instead of masking it as a parse error.
        }
    }

    if (!response.ok) {
        const errorBody = (payload as ServerErrorBody | null)?.error;

        if (response.status === 401 && !skipAuth) {
            // Mirrors auth.interceptor.ts: an authenticated request coming
            // back unauthorized means the session is no longer valid.
            void useAuthStore.getState().clearSession();
        }

        throw new ApiClientError(
            response.status,
            errorBody?.code ?? 'UNKNOWN_ERROR',
            errorBody?.message ?? `Request failed with status ${response.status}`,
            errorBody?.details
        );
    }

    return payload as T;
}

export const httpClient = {
    get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        request<T>(path, { ...options, method: 'DELETE' })
};
