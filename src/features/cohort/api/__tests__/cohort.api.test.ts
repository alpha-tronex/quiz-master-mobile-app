import { getMyCohort } from '../cohort.api';
import { httpClient } from '../../../../shared/api/httpClient';

jest.mock('../../../../shared/api/httpClient', () => ({
    httpClient: { get: jest.fn() }
}));

const getMock = httpClient.get as jest.Mock;

afterEach(() => {
    jest.clearAllMocks();
});

describe('cohort.api', () => {
    test('getMyCohort() fetches /api/cohort/mine and returns the response', async () => {
        const response = { name: 'Guest' };
        getMock.mockResolvedValue(response);

        const result = await getMyCohort();

        expect(getMock).toHaveBeenCalledWith('/api/cohort/mine');
        expect(result).toEqual(response);
    });
});
