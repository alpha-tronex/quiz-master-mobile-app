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
            // 0-based indices, matching the DB/server convention (Quiz.correct):
            // JavaScript (index 0) and Python (index 2).
            answers: ['JavaScript', 'HTML', 'Python', 'CSS'],
            correct: [0, 2]
        },
        {
            questionNum: 1,
            questionType: QuestionType.SingleAnswer,
            question: 'What does HTTP stand for?',
            instructions: 'Select the correct answer',
            answers: ['HyperText Transfer Protocol', 'High Tech Transfer Protocol'],
            // 0-based: 'HyperText Transfer Protocol' is index 0.
            correct: [0]
        },
        {
            questionNum: 2,
            questionType: QuestionType.TrueFalse,
            question: 'JavaScript and Java are the same programming language.',
            instructions: 'Select True or False',
            // 0-based: 'False' is index 1.
            answers: ['True', 'False'],
            correct: [1]
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
        useQuizMock.mockReturnValue({
            isPending: false,
            isError: true,
            error: { message: 'Network error' },
            refetch: jest.fn(),
            isRefetching: false
        });

        await renderScreen();

        expect(screen.getByTestId('take-quiz-error')).toHaveTextContent('Network error');
    });

    test('retries the query when Retry is pressed on the error state', async () => {
        const refetch = jest.fn();
        useQuizMock.mockReturnValue({
            isPending: false,
            isError: true,
            error: { message: 'Network error' },
            refetch,
            isRefetching: false
        });
        const user = userEvent.setup();
        await renderScreen();

        await user.press(screen.getByTestId('take-quiz-retry-button'));

        expect(refetch).toHaveBeenCalledTimes(1);
    });

    test('shows an empty state when the quiz has no questions', async () => {
        useQuizMock.mockReturnValue({
            isPending: false,
            isError: false,
            data: { ...testQuiz, questions: [] }
        });

        await renderScreen();

        expect(screen.getByTestId('take-quiz-empty')).toHaveTextContent('Please check again later. Thanks.');
    });

    test('renders the first question with a disabled submit button until every question is answered', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });

        await renderScreen();

        expect(screen.getByText('Which of the following are programming languages?')).toBeTruthy();
        expect(screen.getByTestId('take-quiz-submit-button').props.accessibilityState).toMatchObject({ disabled: true });
        expect(screen.getByTestId('take-quiz-previous-button').props.accessibilityState).toMatchObject({ disabled: true });
    });

    test('renders the quiz title as a header for screen readers', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });

        await renderScreen();

        expect(screen.getByRole('header', { name: 'General Knowledge' })).toBeTruthy();
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
        expect(screen.getByRole('header', { name: 'Quiz Results' })).toBeTruthy();

        const firstResultCard = screen.getByTestId('take-quiz-result-0');
        expect(firstResultCard.props.accessible).toBe(true);
        expect(firstResultCard.props.accessibilityLabel).toContain('Question 1');
        expect(firstResultCard.props.accessibilityLabel).toContain('Correct');
    });

    test('the results screen is scrollable, so the Accept/Retake buttons stay reachable', async () => {
        // Regression test: the results ScrollView previously had no `flex: 1`
        // on its own `style`, so it sized itself to its content instead of
        // the screen's bounded height and never actually scrolled, leaving
        // the accept/retake buttons unreachable below the fold.
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

        const scrollView = await screen.findByTestId('take-quiz-results-scroll');
        const flattenedStyle = [scrollView.props.style].flat();
        expect(flattenedStyle).toContainEqual(expect.objectContaining({ flex: 1 }));
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
        saveQuizMutate.mockImplementation((_payload, { onSuccess }: { onSuccess: () => void }) => onSuccess());
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

    // Covers the "keep retaking a locked quiz until the app is refreshed"
    // bug: if the backend rejects a resubmission (e.g. the reopen grant was
    // already consumed), the screen must not navigate away as if it
    // succeeded — that would look identical to a real retake going through.
    test('a rejected submission shows an error banner, does not navigate, and re-enables the buttons', async () => {
        useQuizMock.mockReturnValue({ isPending: false, isError: false, data: testQuiz });
        saveQuizMutate.mockImplementation((_payload, { onError }: { onError: () => void }) => onError());
        useSaveQuizMock.mockReturnValue({
            mutate: saveQuizMutate,
            isPending: false,
            isError: true,
            error: { message: 'This quiz has already been completed.' }
        });
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
        expect(navigateMock).not.toHaveBeenCalled();
        expect(screen.getByTestId('take-quiz-save-error-banner')).toHaveTextContent(
            'This quiz has already been completed.'
        );
        expect(screen.getByTestId('take-quiz-accept-button').props.accessibilityState).toMatchObject({
            disabled: false
        });
    });
});
