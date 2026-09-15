import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput } from 'react-native';
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
            {/*
              * `container`'s content is vertically centered with no
              * ScrollView (unlike RegisterScreen), so without this the
              * keyboard opening doesn't reflow anything below it — it just
              * overlaps whatever was already there. On this screen that's
              * the "Log in" button: the software keyboard is the topmost
              * view at that point on screen, so a tap on the button while
              * the keyboard is still up is delivered to the keyboard
              * instead, and `handleSubmit` never fires. `padding` behavior
              * (the standard RN pattern for this) shrinks the content area
              * as the keyboard rises, keeping the button above it.
              */}
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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
                    // Same as RegisterScreen's pass/confirmPass fields, and
                    // for the same reason: a bare `secureTextEntry` field
                    // with no `textContentType` reads as a real password to
                    // iOS. Doesn't fully suppress the system "Save
                    // Password?" Keychain prompt on this screen, though —
                    // confirmed live that it still appears on login (just
                    // not on registration) and covers login-submit-button
                    // entirely, so `.maestro/register-login-logout.yaml`
                    // dismisses it ("Not Now") as a system alert outside
                    // this component's control, rather than relying on this
                    // prop alone. Kept here regardless since it's still
                    // strictly better than leaving the default on.
                    textContentType="oneTimeCode"
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
            </KeyboardAvoidingView>
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
