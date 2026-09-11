import { login, register } from '../auth.api';
import { httpClient } from '../../../../shared/api/httpClient';
import type { User } from '../../../../shared/types';

jest.mock('../../../../shared/api/httpClient', () => ({
    httpClient: { post: jest.fn() }
}));

const postMock = httpClient.post as jest.Mock;

const testUser: User = {
    id: 'u1',
    fname: 'Ada',
    lname: 'Lovelace',
    email: 'ada@example.com',
    phone: '',
    address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
    uname: 'adalovelace',
    pass: '',
    type: 'student',
    token: 'jwt-abc'
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('auth.api', () => {
    test('login() posts to /api/login with skipAuth and returns the response', async () => {
        postMock.mockResolvedValue(testUser);

        const result = await login({ uname: 'adalovelace', pass: 'password123' });

        expect(postMock).toHaveBeenCalledWith(
            '/api/login',
            { uname: 'adalovelace', pass: 'password123' },
            { skipAuth: true }
        );
        expect(result).toEqual(testUser);
    });

    test('register() posts to /api/register with skipAuth and returns the response', async () => {
        postMock.mockResolvedValue(testUser);

        const payload = {
            fname: 'Ada',
            lname: 'Lovelace',
            uname: 'adalovelace',
            email: 'ada@example.com',
            pass: 'password123',
            phone: ''
        };

        const result = await register(payload);

        expect(postMock).toHaveBeenCalledWith('/api/register', payload, { skipAuth: true });
        expect(result).toEqual(testUser);
    });
});
