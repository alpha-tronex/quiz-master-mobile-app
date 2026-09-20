import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QuizListScreen } from '../../features/quizzes/screens/QuizListScreen';
import { TakeQuizScreen } from '../../features/quizzes/screens/TakeQuizScreen';
import { QuizSummaryScreen } from '../../features/quizzes/screens/QuizSummaryScreen';

export type QuizzesStackParamList = {
    QuizList: undefined;
    TakeQuiz: { quizId: number };
    // `locked` is carried over from the QuizList row that was tapped (itself
    // sourced from GET /api/quizzes) so QuizSummaryScreen doesn't need a
    // second round-trip just to know whether to offer a Retake button.
    QuizSummary: { quizId: number; title: string; locked: boolean };
};

const Stack = createNativeStackNavigator<QuizzesStackParamList>();

/**
 * Nested stack backing the "Quizzes" tab. Unlike Home/History/Account (one
 * screen per tab), taking a quiz needs its own screen reached by tapping a
 * list item — see docs/PHASED_DELIVERY.md Phase 3. `TakeQuiz` keeps its
 * native header (with a back button) so a student can bail out of a quiz in
 * progress; `QuizList` hides its header since it renders its own title,
 * matching the other tab screens. `QuizSummary` is reached by tapping an
 * already-taken quiz in the list — see QuizListScreen.tsx.
 */
export function QuizzesStack() {
    return (
        <Stack.Navigator initialRouteName="QuizList">
            <Stack.Screen name="QuizList" component={QuizListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TakeQuiz" component={TakeQuizScreen} options={{ title: 'Quiz' }} />
            <Stack.Screen name="QuizSummary" component={QuizSummaryScreen} options={{ title: 'Quiz Summary' }} />
        </Stack.Navigator>
    );
}
