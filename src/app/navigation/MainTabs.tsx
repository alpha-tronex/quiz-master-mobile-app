import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../../shared/theme';
import { HomeScreen } from '../screens/HomeScreen';
import { QuizzesStack } from './QuizzesStack';
import { HistoryScreen } from '../../features/history/screens/HistoryScreen';
import { AccountScreen } from '../../features/account/screens/AccountScreen';

export type MainTabParamList = {
    Home: undefined;
    Quizzes: undefined;
    History: undefined;
    Account: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Authenticated route group — rendered by RootNavigator once a token is
 * present. No role gate: admin and student accounts land here identically
 * (see docs/MOBILE_APP_ARCHITECTURE.md, "Scope (v1)"). Tab icons are
 * deferred to the Phase 5 branding pass; labels are sufficient for now.
 */
export function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                // `primaryText` (not the base `primary` teal) — the active tab's
                // label is small text plus a meaningful selected-state icon, and
                // `primary` alone falls short of the 4.5:1/3:1 contrast minimums.
                tabBarActiveTintColor: colors.primaryText,
                tabBarInactiveTintColor: colors.textMuted
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Quizzes" component={QuizzesStack} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
}
