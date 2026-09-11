import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { AuthStack } from '../AuthStack';

describe('AuthStack', () => {
    test('starts on the Login screen', async () => {
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        await render(
            <QueryClientProvider client={queryClient}>
                <NavigationContainer>
                    <AuthStack />
                </NavigationContainer>
            </QueryClientProvider>
        );

        expect(screen.getByRole('header', { name: 'Log in' })).toBeTruthy();
    });
});
