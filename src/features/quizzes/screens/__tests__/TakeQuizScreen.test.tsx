import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TakeQuizScreen } from '../TakeQuizScreen';
import { useQuiz } from '../../hooks/useQuiz';
import { useSaveQuiz } from '../../hooks/useSaveQuiz';
import { useAuthStore } from '../../../../core/auth/authStore';
import { QuestionType } from '../../../../shared/types';
import type { Quiz } from '../../../../shared/types';
import type { QuizzesStackParamList } from '../../../../app/navigation/QuizzesStack';
import type { MainTabParamList } from '../../../../app/navigation/MainTabs';

jest.mock('../../hooks/useQuiz', () => ({ useQuiz: jest.fn() }));
jest.mock('../../hooks/useSaveQuiz', () => ({ useSaveQuiz: jest.fn() }));

const useQuizMock = useQuiz as jest.Mock;
const useSaveQuizMock = useSaveQuiz as jest.Mock;

type Props = CompositeScreenProps<
    NativeStackScreenProps<QuizzesStackParamList, 'TakeQuiz'>,
    BottomTabScreenProps<MainTabParamList>
>;

const testQuiz: Quiz = {
    id: 1,
    title: 'General Knowledge',
    questions: [
        {
            questionNum: 0,
            questionType: QuestionType.MultipleChoice,
            question: 'Which of the following are programming languages?',
            instructions: 'Select all correct answers',
            answers: ['JavaScript', 'HTML', 'Python', 'CSS'],
            correct: [1, 3]
        },
        {
            questionNum: 1,
            questionType: QuestionType.SingleAnswer,
            question: 'What does HTTP stand for?',
            instructions: 'Select the correct answer',
            answers: ['HyperText Transfer Protocol', 'High Tech Transfer Protocol'],
            correct: [1]
        },
        {
            questionNum: 2,
            questionType: QuestionType.TrueFalse,
            question: 'JavaScript and Java are the same programming language.',
            instructions: 'Select True or False',
            answers: ['True', 'False'],
            correct: [2]
        }
    ]
};

function renderScreen(navigateMock: jest.Mock = jest.fn()) {
    const navigation = { navigate: navigateMock } as unknown as Props['navigation'];
    const route = { params: { quizId: 1 } } as Props['route'];
    return render(<TakeQuizScreen navigation={navigation} route={route} />);
}

const saveQuizMutate = jest.fn();

beforeEach(() => {
    useSaveQuizMock.mockReturnValue({ mutate: saveQuizMutate, isPending: false });
    useAuthStore.setState({
        user: {
            id: 'u1',
            fname: 'Ada',
            lname: 'Lovelace',
            email: '',
            phone: '',
            address: { street1: '', street2: '', street3: '', city: '', state: '', zipCode: '', country: '' },
            uname: 'adalovelace',
            pass: '',
            type: 'student'
        },
        token: 'jwt-abc',
        isHydrating: false
    });
});

afterEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrating: false });
});

describe('TakeQuizScreen', () => {
    test('shows a loading state while the quiz is pending', async () => {
        useQuizMock.mockReturnValue({ isPending: true, isError: false });

        await renderScreen();

        expect(screen.getByTestId('take-quiz-loading')).toBeTruthy();
    });

    test('shows an error message when the quiz fails to load', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: true, error: { message: 'Network error' } });

        await renderScreen();

        expect(screen.getByTestId('take-quiz-error')).toHaveTextContent('Network error');
    });

    test('renders the first question with a disabled submit button until every question is answered', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });

        await renderScreen();

        expect(screen.getByText('Which of the following are programming languages?')).toBeTruthy();
        expect(screen.getByTestId('take-quiz-submit-button').props.accessibilityState).toMatchObject({ disabled: true });
        expect(screen.getByTestId('take-quiz-previous-button').props.accessibilityState).toMatchObject({ disabled: true });
    });

    test('walks the full quiz-taking loop: answer every question, submit, and see correct results', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });
        const user = userEvent.setup();
        await renderScreen();

        // Q1 (MultipleChoice): select the two correct answers (JavaScript, Python).
        await user.press(screen.getByTestId('answer-option-1'));
        await user.press(screen.getByTestId('answer-option-3'));
        await user.press(screen.getByTestId('take-quiz-next-button'));

        // Q2 (SingleAnswer): select the correct answer.
        expect(await screen.findByText('What does HTTP stand for?')).toBeTruthy();
        await user.press(screen.getByTestId('answer-option-1'));
        await user.press(screen.getByTestId('take-quiz-next-button'));

        // Q3 (TrueFalse): select "False", which is correct.
        expect(await screen.findByText('JavaScript and Java are the same programming language.')).toBeTruthy();
        await user.press(screen.getByTestId('answer-option-2'));

        expect(screen.getByTestId('take-quiz-submit-button').props.accessibilityState).toMatchObject({ disabled: false });
        await user.press(screen.getByTestId('take-quiz-submit-button'));

        expect(await screen.findByTestId('take-quiz-score-summary')).toHaveTextContent('Score: 3 / 3');
        expect(screen.getAllByText('✓ Correct')).toHaveLength(3);
    });

    test('going back to a previous question preserves its earlier selection', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });
        const user = userEvent.setup();
        await renderScreen();

        await user.press(screen.getByTestId('answer-option-1'));
        await user.press(screen.getByTestId('take-quiz-next-button'));
        expect(await screen.findByText('What does HTTP stand for?')).toBeTruthy();

        await user.press(screen.getByTestId('take-quiz-previous-button'));

        expect(await screen.findByText('Which of the following are programming languages?')).toBeTruthy();
        expect(screen.getByTestId('answer-option-1').props.accessibilityState).toMatchObject({ checked: true });
    });

    test('retaking the quiz clears all selections and returns to the first question', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });
        const user = userEvent.setup();
        await renderScreen();

        await user.press(screen.getByTestId('answer-option-1'));
        await user.press(screen.getByTestId('answer-option-3'));
        await user.press(screen.getByTestId('take-quiz-next-button'));
        await user.press(screen.getByTestId('answer-option-1'));
        await user.press(screen.getByTestId('take-quiz-next-button'));
        await user.press(screen.getByTestId('answer-option-2'));
        await user.press(screen.getByTestId('take-quiz-submit-button'));

        await screen.findByTestId('take-quiz-score-summary');
        await user.press(screen.getByTestId('take-quiz-retake-button'));

        expect(await screen.findByText('Which of the following are programming languages?')).toBeTruthy();
        expect(screen.getByTestId('answer-option-1').props.accessibilityState).toMatchObject({ checked: false });
    });

    test('accepting results saves the quiz for the logged-in user and navigates to History', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });
        saveQuizMutate.mockImplementation((_payload, { onSettled }: { onSettled: () => void }) => onSettled());
        const navigateMock = jest.fn();
        const user = userEvent.setup();
        await renderScreen(navigateMock);

        await user.press(screen.getByTestId('answer-option-1'));
        await user.press(screen.getByTestId('answer-option-3'));
        await user.press(screen.getByTestId('take-quiz-next-button'));
        await user.press(screen.getByTestId('answer-option-1'));
        await user.press(screen.getByTestId('take-quiz-next-button'));
        await user.press(screen.getByTestId('answer-option-2'));
        await user.press(screen.getByTestId('take-quiz-submit-button'));
        await screen.findByTestId('take-quiz-score-summary');

        await user.press(screen.getByTestId('take-quiz-accept-button'));

        await waitFor(() => expect(saveQuizMutate).toHaveBeenCalled());
        const [payload] = saveQuizMutate.mock.calls[0];
        expect(payload.username).toBe('adalovelace');
        expect(payload.quizData).toMatchObject({ id: 1, title: 'General Knowledge', score: 3, totalQuestions: 3 });
        expect(navigateMock).toHaveBeenCalledWith('History');
    });
});
