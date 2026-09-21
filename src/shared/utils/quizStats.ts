import type { Quiz } from '../types';

/**
 * Shared formatting/derivation helpers for a completed `Quiz` attempt,
 * extracted from what were previously near-identical local copies in
 * HomeScreen.tsx and HistoryScreen.tsx (stat cards vs. a history list) so
 * the two screens can't drift on rounding, date formatting, etc.
 */

/** Score as a 0-100 percentage; a quiz with no questions scores 0, not NaN. */
export function percentageOf(quiz: Quiz): number {
    const total = quiz.totalQuestions ?? 0;
    const score = quiz.score ?? 0;
    return total > 0 ? (score / total) * 100 : 0;
}

/** Most recently completed quiz, by `completedAt`; falls back to array order if undated. */
export function mostRecent(quizzes: Quiz[]): Quiz {
    return quizzes.reduce((latest, quiz) => {
        const latestTime = latest.completedAt ? new Date(latest.completedAt).getTime() : 0;
        const quizTime = quiz.completedAt ? new Date(quiz.completedAt).getTime() : 0;
        return quizTime > latestTime ? quiz : latest;
    }, quizzes[0]);
}

/**
 * The most recently completed attempt for a specific quiz id, or `undefined`
 * if the student has never completed that quiz — used by QuizSummaryScreen
 * to find which history entry to summarize (a quiz can have more than one
 * attempt once it's been reopened and retaken).
 */
export function latestAttemptFor(quizzes: Quiz[], quizId: number): Quiz | undefined {
    const attempts = quizzes.filter((quiz) => quiz.id === quizId);
    return attempts.length > 0 ? mostRecent(attempts) : undefined;
}

/** One quiz's worth of history entries, grouped for the accordion in HistoryScreen. */
export interface QuizHistoryGroup {
    id: number;
    title: string;
    /** Every completed attempt of this quiz, sorted most-recent-first. */
    attempts: Quiz[];
}

function attemptTime(quiz: Quiz): number {
    return quiz.completedAt ? new Date(quiz.completedAt).getTime() : 0;
}

/**
 * Groups a flat history list (GET /api/quiz/history/:username returns one
 * entry per completed attempt — see HistoryScreen) by quiz id, since a quiz
 * can have more than one attempt once it's been reopened and retaken (same
 * fact `latestAttemptFor` above exists for). Attempts within a group are
 * sorted most-recent-first; groups themselves are ordered by their most
 * recent attempt, so a quiz just retaken bubbles to the top of the list.
 *
 * Order of first-seen attempts within `quizzes` doesn't matter — grouping
 * is by id, not position, and both group and attempt order are re-derived
 * from `completedAt` regardless of input order.
 */
export function groupHistoryByQuiz(quizzes: Quiz[]): QuizHistoryGroup[] {
    const groups = new Map<number, QuizHistoryGroup>();

    for (const quiz of quizzes) {
        const existing = groups.get(quiz.id);
        if (existing) {
            existing.attempts.push(quiz);
        } else {
            groups.set(quiz.id, { id: quiz.id, title: quiz.title, attempts: [quiz] });
        }
    }

    const result = Array.from(groups.values());
    result.forEach((group) => group.attempts.sort((a, b) => attemptTime(b) - attemptTime(a)));
    result.sort((a, b) => attemptTime(b.attempts[0]) - attemptTime(a.attempts[0]));

    return result;
}

/** Locale date + time string, e.g. "1/1/2026, 12:00:00 AM". */
export function formatCompletedAt(date: Quiz['completedAt']): string {
    if (!date) {
        return '';
    }
    const parsed = new Date(date);
    return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString()}`;
}

/** Duration in seconds, formatted as e.g. "1h 2m 3s", "2m 3s", or "3s". */
export function formatDuration(seconds?: number): string {
    if (!seconds || seconds < 0) {
        return 'N/A';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}
