import { formatCompletedAt, formatDuration, latestAttemptFor, mostRecent, percentageOf } from '../quizStats';
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
