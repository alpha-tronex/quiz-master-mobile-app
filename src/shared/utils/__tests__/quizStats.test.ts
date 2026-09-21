import { formatCompletedAt, formatDuration, groupHistoryByQuiz, latestAttemptFor, mostRecent, percentageOf } from '../quizStats';
import type { Quiz } from '../../types';

const baseQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    completedAt: '2026-01-01T00:00:00.000Z',
    score: 2,
    totalQuestions: 4,
    duration: 60,
    questions: []
};

describe('percentageOf', () => {
    test('computes a 0-100 percentage from score/totalQuestions', () => {
        expect(percentageOf({ ...baseQuiz, score: 3, totalQuestions: 4 })).toBe(75);
    });

    test('returns 0, not NaN, when totalQuestions is 0', () => {
        expect(percentageOf({ ...baseQuiz, score: 0, totalQuestions: 0 })).toBe(0);
    });

    test('treats a missing score/totalQuestions as 0', () => {
        expect(percentageOf({ ...baseQuiz, score: undefined, totalQuestions: undefined })).toBe(0);
    });
});

describe('mostRecent', () => {
    test('returns the quiz with the latest completedAt', () => {
        const older = { ...baseQuiz, id: 1, completedAt: '2026-01-01T00:00:00.000Z' };
        const newer = { ...baseQuiz, id: 2, completedAt: '2026-02-01T00:00:00.000Z' };

        expect(mostRecent([older, newer])).toBe(newer);
        expect(mostRecent([newer, older])).toBe(newer);
    });

    test('falls back to array order when completedAt is missing', () => {
        const first = { ...baseQuiz, id: 1, completedAt: undefined };
        const second = { ...baseQuiz, id: 2, completedAt: undefined };

        expect(mostRecent([first, second])).toBe(first);
    });
});

describe('latestAttemptFor', () => {
    test('returns the most recent attempt matching the given quiz id', () => {
        const olderAttempt = { ...baseQuiz, id: 5, completedAt: '2026-01-01T00:00:00.000Z' };
        const newerAttempt = { ...baseQuiz, id: 5, completedAt: '2026-03-01T00:00:00.000Z' };
        const otherQuiz = { ...baseQuiz, id: 9, completedAt: '2026-04-01T00:00:00.000Z' };

        expect(latestAttemptFor([olderAttempt, newerAttempt, otherQuiz], 5)).toBe(newerAttempt);
    });

    test('returns undefined when there is no attempt for that quiz id', () => {
        expect(latestAttemptFor([baseQuiz], 999)).toBeUndefined();
    });
});

describe('formatCompletedAt', () => {
    test('returns an empty string when no date is given', () => {
        expect(formatCompletedAt(undefined)).toBe('');
    });

    test('formats a date into a locale date + time string', () => {
        const result = formatCompletedAt('2026-01-01T00:00:00.000Z');
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain(new Date('2026-01-01T00:00:00.000Z').toLocaleDateString());
    });
});

describe('groupHistoryByQuiz', () => {
    test('groups multiple attempts of the same quiz id under one entry', () => {
        const first = { ...baseQuiz, id: 5, title: 'Basic Algebra', completedAt: '2026-01-01T00:00:00.000Z' };
        const second = { ...baseQuiz, id: 5, title: 'Basic Algebra', completedAt: '2026-02-01T00:00:00.000Z' };

        const groups = groupHistoryByQuiz([first, second]);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({ id: 5, title: 'Basic Algebra' });
        expect(groups[0].attempts).toHaveLength(2);
    });

    test('keeps distinct quiz ids as separate groups', () => {
        const algebra = { ...baseQuiz, id: 5, title: 'Basic Algebra' };
        const history = { ...baseQuiz, id: 9, title: 'US History' };

        const groups = groupHistoryByQuiz([algebra, history]);

        expect(groups).toHaveLength(2);
        expect(groups.map((group) => group.id).sort()).toEqual([5, 9]);
    });

    test('sorts attempts within a group most-recent-first, regardless of input order', () => {
        const older = { ...baseQuiz, id: 5, completedAt: '2026-01-01T00:00:00.000Z' };
        const newer = { ...baseQuiz, id: 5, completedAt: '2026-03-01T00:00:00.000Z' };

        const groups = groupHistoryByQuiz([older, newer]);

        expect(groups[0].attempts).toEqual([newer, older]);
    });

    test('orders groups by their most recent attempt, most-recent-first', () => {
        const recentlyRetaken = { ...baseQuiz, id: 1, title: 'Recently retaken', completedAt: '2026-03-01T00:00:00.000Z' };
        const takenLongAgo = { ...baseQuiz, id: 2, title: 'Taken long ago', completedAt: '2026-01-01T00:00:00.000Z' };

        const groups = groupHistoryByQuiz([takenLongAgo, recentlyRetaken]);

        expect(groups.map((group) => group.title)).toEqual(['Recently retaken', 'Taken long ago']);
    });

    test('returns an empty array for an empty input', () => {
        expect(groupHistoryByQuiz([])).toEqual([]);
    });
});

describe('formatDuration', () => {
    test('formats seconds only', () => {
        expect(formatDuration(45)).toBe('45s');
    });

    test('formats minutes and seconds', () => {
        expect(formatDuration(125)).toBe('2m 5s');
    });

    test('formats hours, minutes, and seconds', () => {
        expect(formatDuration(3725)).toBe('1h 2m 5s');
    });

    test('returns N/A for missing or negative durations', () => {
        expect(formatDuration(undefined)).toBe('N/A');
        expect(formatDuration(-5)).toBe('N/A');
    });
});
