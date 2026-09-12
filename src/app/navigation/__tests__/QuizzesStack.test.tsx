import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { QuizzesStack } from '../QuizzesStack';
import { getQuiz, getQuizzes } from '../../../features/quizzes/api/quiz.api';
import { QuestionType } from '../../../shared/types';

jest.mock('../../../features/quizzes/api/quiz.api', () => ({
    getQuizzes: jest.fn(),
    getQuiz: jest.fn()
}));

const getQuizzesMock = getQuizzes as jest.Mock;
const getQuizMock = getQuiz as jest.Mock;

function renderStack() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <NavigationContainer>
                <QuizzesStack />
            </NavigationContainer>
        </QueryClientProvider>
    );
}

afterEach(() => {
    jest.clearAllMocks();
});

describe('QuizzesStack', () => {
    test('starts on the quiz list and navigates into TakeQuiz when a quiz is selected', async () => {
        getQuizzesMock.mockResolvedValue([{ id: 1, title: 'General Knowledge' }]);
        getQuizMock.mockResolvedValue({
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
        });
        const user = userEvent.setup();
        await renderStack();

        expect(await screen.findByText('General Knowledge')).toBeTruthy();

        await user.press(screen.getByTestId('quiz-list-item-1'));

        expect(await screen.findByText('Is the sky blue?')).toBeTruthy();
        expect(getQuizMock).toHaveBeenCalledWith(1);
    });
});
