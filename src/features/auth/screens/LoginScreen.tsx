import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, TextField } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { validateForm, fieldErrorMap } from '../../../shared/validation';
import { useLogin } from '../hooks/useLogin';
import type { AuthStackParamList } from '../../../app/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * POST /api/login via `useLogin`. A successful login persists the session
 * in `authStore`, which `RootNavigator` picks up to switch over to
 * `MainTabs` — this screen doesn't navigate on success itself (see
 * useLogin.ts for why). Field validation mirrors the Angular login
 * component: `uname`/`pass` checked with the same rules as the backend.
 */
export function LoginScreen({ navigation }: Props) {
    const [uname, setUname] = useState('');
    const [pass, setPass] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const login = useLogin();

    function handleSubmit() {
        const result = validateForm({ uname, pass });
        if (!result.valid) {
            setFieldErrors(fieldErrorMap(result));
            return;
        }
        setFieldErrors({});
        login.mutate({ uname: uname.trim(), pass });
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title} accessibilityRole="header">Log in</Text>

            {login.isError ? (
                <Text style={styles.errorBanner} testID="login-error-banner">
                    {login.error.message}
                </Text>
            ) : null}

            <TextField
                testID="login-uname-input"
                label="Username"
                value={uname}
                onChangeText={setUname}
                error={fieldErrors.uname}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextField
                testID="login-pass-input"
                label="Password"
                value={pass}
                onChangeText={setPass}
                error={fieldErrors.pass}
                secureTextEntry
            />

            <Button
                testID="login-submit-button"
                label="Log in"
                onPress={handleSubmit}
                loading={login.isPending}
            />

            <Text
                testID="login-register-link"
                style={styles.link}
                accessibilityRole="link"
                onPress={() => navigation.navigate('Register')}
            >
                Don&apos;t have an account? Register
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: spacing.lg
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center'
    },
    errorBanner: {
        color: colors.danger,
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.md,
        textAlign: 'center'
    },
    link: {
        marginTop: spacing.md,
        color: colors.primary,
        fontSize: typography.fontSize.sm,
        textAlign: 'center'
    }
});
