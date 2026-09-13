import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Banner, Button, Card, TextField } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { validateForm, fieldErrorMap } from '../../../shared/validation';
import { useRegister } from '../hooks/useRegister';
import type { AuthStackParamList } from '../../../app/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

/**
 * POST /api/register via `useRegister`. Address is deliberately not
 * collected here — see the doc comment on `RegisterPayload` in
 * `features/auth/api/auth.api.ts` for why.
 *
 * Field grouping and validation UX mirror `register.component.html`'s
 * mandatory-fields pattern rather than just its field set: fields are split
 * into a "Required information" card (username, password, confirm password
 * — matches the web app's `#f8f9fa`-shaded "Required Information" card) and
 * an "Optional information" card (first/last name, phone, email — the
 * web app's white "Optional Information" card), in the same field order as
 * the web form. As on the web, the submit button stays disabled until the
 * form is valid (`[disabled]="registerForm.invalid || user.pass !==
 * user.confirmPass"`), and a field's error only renders once it's been
 * touched (blurred) or a submit was attempted — recreating Angular's
 * `(dirty || touched)` gate without a forms library. `pass`/`confirmPass`
 * equality is checked client-side only (the server has no `confirmPass`
 * concept), same as `register.component.ts`. A successful register
 * auto-logs the user in (see useRegister.ts), so — like LoginScreen — this
 * screen doesn't navigate on success itself.
 *
 * Wrapped in a top-edge-only `SafeAreaView`: the header (screen title) sits
 * flush against the top of the ScrollView content, so without this it
 * renders under the status bar / Dynamic Island on notched devices. Bottom
 * edge is left to the ScrollView itself since the keyboard/home indicator
 * area is already handled by normal scroll padding.
 *
 * Each field's return key advances focus to the next field via a
 * `TextField` ref (`submitBehavior="submit"` keeps the keyboard open across
 * the hop instead of dismissing it); the last field, email, fires
 * `handleSubmit` directly so pressing return/"go" there behaves like
 * tapping the Register button.
 */
export function RegisterScreen({ navigation }: Props) {
    const [uname, setUname] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const register = useRegister();

    const passRef = useRef<TextInput>(null);
    const confirmPassRef = useRef<TextInput>(null);
    const fnameRef = useRef<TextInput>(null);
    const lnameRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);

    const validation = validateForm({ uname, pass, email, phone, fname, lname });
    const errors = fieldErrorMap(validation);
    const confirmPassMissing = confirmPass.trim().length === 0;
    const passwordsMismatch = !confirmPassMissing && pass !== confirmPass;
    const confirmPassError = confirmPassMissing
        ? 'Confirm password is required'
        : passwordsMismatch
            ? 'Passwords do not match'
            : undefined;
    const isFormValid = validation.valid && !confirmPassMissing && !passwordsMismatch;

    function fieldError(field: string): string | undefined {
        if (field === 'confirmPass') {
            return touched.confirmPass || submitAttempted ? confirmPassError : undefined;
        }
        return touched[field] || submitAttempted ? errors[field] : undefined;
    }

    function markTouched(field: string) {
        return () => setTouched((prev) => ({ ...prev, [field]: true }));
    }

    function handleSubmit() {
        setSubmitAttempted(true);
        if (!isFormValid) {
            return;
        }
        register.mutate({
            fname: fname.trim(),
            lname: lname.trim(),
            uname: uname.trim(),
            email: email.trim(),
            pass,
            phone: phone.trim()
        });
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.title} accessibilityRole="header">Register</Text>

                {register.isError ? (
                    <Banner message={register.error.message} variant="error" testID="register-error-banner" />
                ) : null}

                <Text style={styles.sectionTitle} accessibilityRole="header">Required information</Text>
                <Card testID="register-required-section" style={styles.requiredCard}>
                    <TextField
                        testID="register-uname-input"
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
                        testID="register-pass-input"
                        label="Password"
                        value={pass}
                        onChangeText={setPass}
                        onBlur={markTouched('pass')}
                        error={fieldError('pass')}
                        isPassword
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => confirmPassRef.current?.focus()}
                    />
                    <TextField
                        ref={confirmPassRef}
                        testID="register-confirm-pass-input"
                        label="Confirm password"
                        value={confirmPass}
                        onChangeText={setConfirmPass}
                        onBlur={markTouched('confirmPass')}
                        error={fieldError('confirmPass')}
                        isPassword
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => fnameRef.current?.focus()}
                    />
                </Card>

                <Text style={styles.sectionTitle} accessibilityRole="header">Optional information</Text>
                <Card testID="register-optional-section" style={styles.optionalCard}>
                    <TextField
                        ref={fnameRef}
                        testID="register-fname-input"
                        label="First name"
                        value={fname}
                        onChangeText={setFname}
                        onBlur={markTouched('fname')}
                        error={fieldError('fname')}
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => lnameRef.current?.focus()}
                    />
                    <TextField
                        ref={lnameRef}
                        testID="register-lname-input"
                        label="Last name"
                        value={lname}
                        onChangeText={setLname}
                        onBlur={markTouched('lname')}
                        error={fieldError('lname')}
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => phoneRef.current?.focus()}
                    />
                    <TextField
                        ref={phoneRef}
                        testID="register-phone-input"
                        label="Phone"
                        value={phone}
                        onChangeText={setPhone}
                        onBlur={markTouched('phone')}
                        error={fieldError('phone')}
                        keyboardType="phone-pad"
                        returnKeyType="next"
                        submitBehavior="submit"
                        onSubmitEditing={() => emailRef.current?.focus()}
                    />
                    <TextField
                        ref={emailRef}
                        testID="register-email-input"
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        onBlur={markTouched('email')}
                        error={fieldError('email')}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        returnKeyType="go"
                        onSubmitEditing={handleSubmit}
                    />
                </Card>

                <Button
                    testID="register-submit-button"
                    label="Register"
                    onPress={handleSubmit}
                    disabled={!isFormValid}
                    loading={register.isPending}
                    style={styles.submitButton}
                />

                <Text
                    testID="register-login-link"
                    style={styles.link}
                    accessibilityRole="link"
                    onPress={() => navigation.navigate('Login')}
                >
                    Already have an account? Log in
                </Text>
            </ScrollView>
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
        backgroundColor: colors.background
    },
    content: {
        padding: spacing.lg
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center'
    },
    sectionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.sm
    },
    requiredCard: {
        marginBottom: spacing.lg
    },
    optionalCard: {
        backgroundColor: colors.background,
        marginBottom: spacing.lg
    },
    submitButton: {
        marginTop: spacing.xs
    },
    link: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
        color: colors.primaryText,
        fontSize: typography.fontSize.sm,
        textAlign: 'center'
    }
});
