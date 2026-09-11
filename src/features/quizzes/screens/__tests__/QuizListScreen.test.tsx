import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { QuizListScreen } from '../QuizListScreen';

test('QuizListScreen renders its title', async () => {
    await render(<QuizListScreen />);

    expect(screen.getByText('Quizzes')).toBeTruthy();
});
