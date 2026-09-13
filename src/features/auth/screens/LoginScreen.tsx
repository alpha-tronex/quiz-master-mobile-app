import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Banner, Button, TextField } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { validateForm, fieldErrorMap } from '../../../shared/validation';
import { useLogin } from '../hooks/useLogin';
import type { AuthStackParamList } from '../../../app/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/** Displayed above the "Log in" heading so the screen reads as the app's
 * entry point rather than a bare form — matches app.json's `name`. */
const APP_NAME = 'Quiz Master';

/**
 * POST /api/login via `useLogin`. Mirrors the Angular login component's
 * mandatory-fields UX (`login.component.html`) rather than just its field
 * set: both `uname`/`pass` are required there via template-driven
 * `required`/`minlength`/`pattern` validators that (a) keep the submit
 * button disabled until the form is valid — `[disabled]="loginForm.invalid"`
 * — and (b) only surface a field's error once it's been interacted with —
 * `*ngIf="uname.invalid && (uname.dirty || uname.touched)"`. There's no
 * Angular forms module on the RN side, so `validateForm`/`fieldErrorMap`
 * (the same functions used at submit time) are recomputed on every render
 * to derive both the disabled state and the per-field errors, and a
 * `touched` map recreates "dirty || touched" — a field's error only renders
 * once it has been blurred at least once, or a submit was attempted.
 *
 * The username field's return key focuses the password field
 * (`submitBehavior="submit"` keeps the keyboard open across the hop); the
 * password field's return/"go" key fires `handleSubmit` directly, so
 * pressing it behaves like tapping the Log in button.
 */
export function LoginScreen({ navigation }: Props) {
    const [uname, setUname] = useState('');
    const [pass, setPass] = useState('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const login = useLogin();
    const passRef = useRef<TextInput>(null);

    const validation = validateForm({ uname, pass });
    const errors = fieldErrorMap(validation);

    function fieldError(field: string): string | undefined {
        return touched[field] || submitAttempted ? errors[field] : undefined;
    }

    function markTouched(field: string) {
        return () => setTouched((prev) => ({ ...prev, [field]: true }));
    }

    function handleSubmit() {
        setSubmitAttempted(true);
        if (!validation.valid) {
            return;
        }
        login.mutate({ uname: uname.trim(), pass });
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.appName} testID="login-app-name">{APP_NAME}</Text>
                <Text style={styles.title} accessibilityRole="header">Log in</Text>

                {login.isError ? (
                    <Banner message={login.error.message} variant="error" testID="login-error-banner" />
                ) : null}

                <TextField
                    testID="login-uname-input"
                    label="Username"
                    value={uname}
                    onChangeText={setUname}
                    onBlur={markTouched('uname')}
                    error={fieldError('uname')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => passRef.current?.focus()}
                />
                <TextField
                    ref={passRef}
                    testID="login-pass-input"
                    label="Password"
                    value={pass}
                    onChangeText={setPass}
                    onBlur={markTouched('pass')}
                    error={fieldError('pass')}
                    isPassword
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                />

                <Button
                    testID="login-submit-button"
                    label="Log in"
                    onPress={handleSubmit}
                    disabled={!validation.valid}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: spacing.lg
    },
    appName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.primaryText,
        marginBottom: spacing.sm,
        textAlign: 'center'
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center'
    },
    link: {
        marginTop: spacing.md,
        color: colors.primaryText,
        fontSize: typography.fontSize.sm,
        textAlign: 'center'
    }
});
