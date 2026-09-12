import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { QuizListScreen } from '../QuizListScreen';
import { useQuizzes } from '../../hooks/useQuizzes';
import type { QuizzesStackParamList } from '../../../../app/navigation/QuizzesStack';

jest.mock('../../hooks/useQuizzes', () => ({ useQuizzes: jest.fn() }));

const useQuizzesMock = useQuizzes as jest.Mock;

type Props = NativeStackScreenProps<QuizzesStackParamList, 'QuizList'>;

function renderScreen(navigateMock: jest.Mock = jest.fn()) {
    const navigation = { navigate: navigateMock } as unknown as Props['navigation'];
    const route = {} as Props['route'];
    return render(<QuizListScreen navigation={navigation} route={route} />);
}

afterEach(() => {
    jest.clearAllMocks();
});

describe('QuizListScreen', () => {
    test('shows a loading state while quizzes are pending', async () => {
        useQuizzesMock.mockReturnValue({ isPending: true, isError: false });

        await renderScreen();

        expect(screen.getByTestId('quiz-list-loading')).toBeTruthy();
    });

    test('shows an error message when the quizzes fail to load', async () => {
        useQuizzesMock.mockReturnValue({ isPending: false, isError: true, error: { message: 'Network error' } });

        await renderScreen();

        expect(screen.getByTestId('quiz-list-error')).toHaveTextContent('Network error');
    });

    test('shows an empty state when there are no quizzes', async () => {
        useQuizzesMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await renderScreen();

        expect(screen.getByTestId('quiz-list-empty')).toBeTruthy();
    });

    test('renders each quiz and navigates to TakeQuiz when tapped', async () => {
        useQuizzesMock.mockReturnValue({
            isPending: false,
            isError: false,
            data: [
                { id: 1, title: 'General Knowledge' },
                { id: 2, title: 'Web Basics' }
            ]
        });
        const navigateMock = jest.fn();
        const user = userEvent.setup();
        await renderScreen(navigateMock);

        expect(screen.getByText('General Knowledge')).toBeTruthy();
        expect(screen.getByText('Web Basics')).toBeTruthy();

        await user.press(screen.getByTestId('quiz-list-item-2'));

        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('TakeQuiz', { quizId: 2 }));
    });
});
