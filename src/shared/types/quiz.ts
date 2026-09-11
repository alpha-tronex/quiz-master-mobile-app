/**
 * Ported from the Angular app's src/app/shared/models/quiz.ts.
 * Field names and shapes are kept identical to the web client so the
 * backend contract (server/routes/quizRoutes.js, adminQuizRoutes.js)
 * doesn't fork between clients.
 */

export enum QuestionType {
    TrueFalse = 'TrueFalse',
    MultipleChoice = 'MultipleChoice',
    SingleAnswer = 'SingleAnswer'
}

export const QuestionTypeLabels: Record<QuestionType, string> = {
    [QuestionType.TrueFalse]: 'True or False',
    [QuestionType.MultipleChoice]: 'Multiple Choice',
    [QuestionType.SingleAnswer]: 'Single Answer'
};

export interface Question {
    questionNum: number;
    questionType: QuestionType;
    question: string;
    instructions: string;
    answers: string[];
    correct: number[];
    /** Client-local state while a quiz is in progress; absent on freshly-fetched quiz data. */
    selection?: number[];
    isCorrect?: boolean | null;
}

/**
 * A quiz as returned by GET /api/quiz and GET /api/quiz?id=, and as embedded
 * (with score/completedAt) in a user's quiz history via
 * GET /api/quiz/history/:username.
 */
export interface Quiz {
    id: number;
    title: string;
    description?: string;
    completedAt?: Date | string;
    questions: Question[];
    score?: number;
    totalQuestions?: number;
    /** Duration in seconds. */
    duration?: number;
}

/** Shape returned by GET /api/quizzes — a lightweight listing, not the full quiz. */
export interface QuizSummary {
    id: number;
    title: string;
}
