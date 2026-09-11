import { httpClient } from '../httpClient';
import { ApiClientError } from '../apiError';
import { useAuthStore } from '../../../core/auth/authStore';
import { API_BASE_URL } from '../../../core/config';

/**
 * httpClient tests mock `global.fetch` directly rather than using msw.
 * msw v2's package resolution (it ships pure-ESM internals, e.g. the
 * `rettime` dependency) is incompatible with the React Native/Expo Jest
 * preset's custom resolver as of Expo SDK 57 / RN 0.86 — it resolves to
 * raw ESM/TS source Jest can't parse, and the documented
 * `customExportConditions` workaround doesn't help because the RN preset
 * substitutes its own resolver rather than Node's conditional-exports
 * resolution. Mocking `fetch` directly gives the same coverage of
 * httpClient's own logic (header injection, error normalization, the 401
 * hook into authStore) without fighting that incompatibility.
 */
function mockFetchOnce(response: { status: number; body?: unknown; ok?: boolean; bodyText?: string }): jest.Mock {
    const text =
        response.bodyText !== undefined
            ? response.bodyText
            : response.body !== undefined
              ? JSON.stringify(response.body)
              : '';

    const fetchMock = jest.fn().mockResolvedValue({
        ok: response.ok ?? (response.status >= 200 && response.status < 300),
        status: response.status,
        text: () => Promise.resolve(text)
    } as Response);

    global.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
}

afterEach(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('httpClient', () => {
    test('GET returns the parsed JSON body on success', async () => {
        mockFetchOnce({ status: 200, body: [{ id: 0, title: 'Islam 101' }] });

        const result = await httpClient.get<{ id: number; title: string }[]>('/api/quizzes');

        expect(result).toEqual([{ id: 0, title: 'Islam 101' }]);
    });

    test('builds the request URL from API_BASE_URL and the given path', async () => {
        const fetchMock = mockFetchOnce({ status: 200, body: [] });

        await httpClient.get('/api/quizzes');

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/api/quizzes`,
            expect.objectContaining({ method: 'GET' })
        );
    });

    test('attaches the Authorization header from the auth store when a token is present', async () => {
        useAuthStore.setState({ token: 'test-token', user: null, isHydrating: false });
        const fetchMock = mockFetchOnce({ status: 200, body: [] });

        await httpClient.get('/api/quizzes');

        const [, requestInit] = fetchMock.mock.calls[0];
        expect((requestInit.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    });

    test('omits the Authorization header when no token is present', async () => {
        const fetchMock = mockFetchOnce({ status: 200, body: [] });

        await httpClient.get('/api/quizzes');

        const [, requestInit] = fetchMock.mock.calls[0];
        expect((requestInit.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    test('skipAuth omits the Authorization header even when a token is present', async () => {
        useAuthStore.setState({ token: 'test-token', user: null, isHydrating: false });
        const fetchMock = mockFetchOnce({ status: 200, body: { token: 'new-token' } });

        await httpClient.post('/api/login', { uname: 'x', pass: 'y' }, { skipAuth: true });

        const [, requestInit] = fetchMock.mock.calls[0];
        expect((requestInit.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    test('sends the body as JSON with a Content-Type header on POST', async () => {
        const fetchMock = mockFetchOnce({ status: 201, body: { quizId: 0 } });

        await httpClient.post('/api/quiz/upload', { title: 'New Quiz' });

        const [, requestInit] = fetchMock.mock.calls[0];
        expect(requestInit.body).toBe(JSON.stringify({ title: 'New Quiz' }));
        expect((requestInit.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });

    test('throws an ApiClientError built from the server error body on a non-2xx response', async () => {
        mockFetchOnce({
            status: 401,
            body: { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } }
        });

        await expect(httpClient.post('/api/login', {}, { skipAuth: true })).rejects.toMatchObject({
            status: 401,
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password'
        });
    });

    test('a 401 on an authenticated request clears the session', async () => {
        useAuthStore.setState({ token: 'stale-token', user: null, isHydrating: false });
        mockFetchOnce({ status: 401, body: { error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } } });

        await expect(httpClient.get('/api/quizzes')).rejects.toBeInstanceOf(ApiClientError);

        expect(useAuthStore.getState().token).toBeNull();
    });

    test('a 401 during a skipAuth call (e.g. login) does not clear the session', async () => {
        useAuthStore.setState({ token: 'still-valid-token', user: null, isHydrating: false });
        mockFetchOnce({ status: 401, body: { error: { code: 'INVALID_CREDENTIALS', message: 'nope' } } });

        await expect(httpClient.post('/api/login', {}, { skipAuth: true })).rejects.toBeInstanceOf(ApiClientError);

        expect(useAuthStore.getState().token).toBe('still-valid-token');
    });

    test('falls back to a generic error when the server error body is missing fields', async () => {
        mockFetchOnce({ status: 500, body: {} });

        await expect(httpClient.get('/api/quizzes')).rejects.toMatchObject({
            status: 500,
            code: 'UNKNOWN_ERROR'
        });
    });

    test('a network failure (fetch rejects) surfaces as ApiClientError.networkError', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

        await expect(httpClient.get('/api/quizzes')).rejects.toMatchObject({
            code: 'NETWORK_ERROR'
        });
    });

    test('an OK response with a non-JSON body throws ApiClientError.invalidResponse', async () => {
        mockFetchOnce({ status: 200, bodyText: 'not json', ok: true });

        await expect(httpClient.get('/api/quizzes')).rejects.toMatchObject({
            code: 'INVALID_RESPONSE'
        });
    });

    test('an empty-body success resolves to null rather than throwing', async () => {
        mockFetchOnce({ status: 200, bodyText: '', ok: true });

        await expect(httpClient.delete('/api/quiz/delete/8')).resolves.toBeNull();
    });
});
