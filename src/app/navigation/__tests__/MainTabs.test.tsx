import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import { MainTabs } from '../MainTabs';

describe('MainTabs', () => {
    test('starts on the Home tab and shows the other tab labels', async () => {
        await render(
            <NavigationContainer>
                <MainTabs />
            </NavigationContainer>
        );

        expect(screen.getByText('Welcome to Quiz Master')).toBeTruthy();
        expect(screen.getByText('Home')).toBeTruthy();
        expect(screen.getByText('Quizzes')).toBeTruthy();
        expect(screen.getByText('History')).toBeTruthy();
        expect(screen.getByText('Account')).toBeTruthy();
    });
});
