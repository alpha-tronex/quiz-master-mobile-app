import { getQuiz, getQuizzes, saveQuiz } from '../quiz.api';
import { httpClient } from '../../../../shared/api/httpClient';
import type { Quiz, QuizSummary } from '../../../../shared/types';
import { QuestionType } from '../../../../shared/types';

jest.mock('../../../../shared/api/httpClient', () => ({
    httpClient: { get: jest.fn(), post: jest.fn() }
}));

const getMock = httpClient.get as jest.Mock;
const postMock = httpClient.post as jest.Mock;

const testQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    questions: [
        {
            questionNum: 0,
            questionType: QuestionType.TrueFalse,
            question: 'Is the sky blue?',
            instructions: 'Select the correct answer',
            answers: ['True', 'False'],
            correct: [1]
        }
    ]
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('quiz.api', () => {
    test('getQuizzes() fetches /api/quizzes and returns the summaries', async () => {
        const summaries: QuizSummary[] = [{ id: 1, title: 'General Knowledge' }];
        getMock.mockResolvedValue(summaries);

        const result = await getQuizzes();

        expect(getMock).toHaveBeenCalledWith('/api/quizzes');
        expect(result).toEqual(summaries);
    });

    test('getQuiz() fetches /api/quiz without a query string when no id is given', async () => {
        getMock.mockResolvedValue(testQuiz);

        const result = await getQuiz();

        expect(getMock).toHaveBeenCalledWith('/api/quiz');
        expect(result).toEqual(testQuiz);
    });

    test('getQuiz(id) fetches /api/quiz?id= with the given id', async () => {
        getMock.mockResolvedValue(testQuiz);

        await getQuiz(1);

        expect(getMock).toHaveBeenCalledWith('/api/quiz?id=1');
    });

    test('saveQuiz() posts the username and quizData to /api/quiz', async () => {
        const response = { message: 'Quiz saved successfully', quiz: testQuiz };
        postMock.mockResolvedValue(response);

        const payload = { username: 'adalovelace', quizData: testQuiz };
        const result = await saveQuiz(payload);

        expect(postMock).toHaveBeenCalledWith('/api/quiz', payload);
        expect(result).toEqual(response);
    });
});
