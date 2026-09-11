import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import { AuthStack } from '../AuthStack';

describe('AuthStack', () => {
    test('starts on the Login screen', async () => {
        await render(
            <NavigationContainer>
                <AuthStack />
            </NavigationContainer>
        );

        expect(screen.getByText('Log in')).toBeTruthy();
    });
});
