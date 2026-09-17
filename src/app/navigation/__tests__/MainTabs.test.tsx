import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { MainTabs } from '../MainTabs';
import { useQuizHistory } from '../../../features/history/hooks/useQuizHistory';

jest.mock('../../../features/history/hooks/useQuizHistory', () => ({ useQuizHistory: jest.fn() }));

const useQuizHistoryMock = useQuizHistory as jest.Mock;

const renderMainTabs = () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

    return render(
        <QueryClientProvider client={queryClient}>
            <NavigationContainer>
                <MainTabs />
            </NavigationContainer>
        </QueryClientProvider>
    );
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('MainTabs', () => {
    test('starts on the Home tab and shows the other tab labels', async () => {
        useQuizHistoryMock.mockReturnValue({ isPending: false, isError: false, data: [] });

        await renderMainTabs();

        // Home's own content is covered by HomeScreen.test.tsx; here we only
        // care that the tab bar is wired up correctly.
        expect(screen.getByText('Welcome to Quiz Master')).toBeTruthy();
        expect(screen.getByText('Home')).toBeTruthy();
        expect(screen.getByText('Quizzes')).toBeTruthy();
        expect(screen.getByText('History')).toBeTruthy();
        expect(screen.getByText('Account')).toBeTruthy();
    });
});
