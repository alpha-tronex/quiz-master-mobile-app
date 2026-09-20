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
