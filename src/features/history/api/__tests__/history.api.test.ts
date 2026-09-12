import { getQuizHistory } from '../history.api';
import { httpClient } from '../../../../shared/api/httpClient';

jest.mock('../../../../shared/api/httpClient', () => ({
    httpClient: { get: jest.fn() }
}));

const getMock = httpClient.get as jest.Mock;

afterEach(() => {
    jest.clearAllMocks();
});

describe('history.api', () => {
    test('getQuizHistory() fetches /api/quiz/history/:username and returns the response', async () => {
        const response = { quizzes: [] };
        getMock.mockResolvedValue(response);

        const result = await getQuizHistory('adalovelace');

        expect(getMock).toHaveBeenCalledWith('/api/quiz/history/adalovelace');
        expect(result).toEqual(response);
    });

    test('URL-encodes the username', async () => {
        getMock.mockResolvedValue({ quizzes: [] });

        await getQuizHistory('ada lovelace');

        expect(getMock).toHaveBeenCalledWith('/api/quiz/history/ada%20lovelace');
    });
});
