import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, TextField } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { validateForm, fieldErrorMap } from '../../../shared/validation';
import { useRegister } from '../hooks/useRegister';
import type { AuthStackParamList } from '../../../app/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

/**
 * POST /api/register via `useRegister`. Address is deliberately not
 * collected here — see the doc comment on `RegisterPayload` in
 * `features/auth/api/auth.api.ts` for why. `pass`/`confirmPass` equality is
 * checked client-side only (the server has no `confirmPass` concept),
 * mirroring `register.component.ts`. A successful register auto-logs the
 * user in (see useRegister.ts), so — like LoginScreen — this screen doesn't
 * navigate on success itself.
 */
export function RegisterScreen({ navigation }: Props) {
    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [uname, setUname] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const register = useRegister();

    function handleSubmit() {
        const result = validateForm({ uname, pass, email, phone, fname, lname });
        const errors = fieldErrorMap(result);

        if (pass !== confirmPass) {
            errors.confirmPass = 'Passwords do not match';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title} accessibilityRole="header">Register</Text>

            {register.isError ? (
                <Text style={styles.errorBanner} testID="register-error-banner">
                    {register.error.message}
                </Text>
            ) : null}

            <TextField
                testID="register-fname-input"
                label="First name"
                value={fname}
                onChangeText={setFname}
                error={fieldErrors.fname}
            />
            <TextField
                testID="register-lname-input"
                label="Last name"
                value={lname}
                onChangeText={setLname}
                error={fieldErrors.lname}
            />
            <TextField
                testID="register-uname-input"
                label="Username"
                value={uname}
                onChangeText={setUname}
                error={fieldErrors.uname}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextField
                testID="register-email-input"
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
            />
            <TextField
                testID="register-phone-input"
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                error={fieldErrors.phone}
                keyboardType="phone-pad"
            />
            <TextField
                testID="register-pass-input"
                label="Password"
                value={pass}
                onChangeText={setPass}
                error={fieldErrors.pass}
                secureTextEntry
            />
            <TextField
                testID="register-confirm-pass-input"
                label="Confirm password"
                value={confirmPass}
                onChangeText={setConfirmPass}
                error={fieldErrors.confirmPass}
                secureTextEntry
            />

            <Button
                testID="register-submit-button"
                label="Register"
                onPress={handleSubmit}
                loading={register.isPending}
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
    );
}

const styles = StyleSheet.create({
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
    errorBanner: {
        color: colors.danger,
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.md,
        textAlign: 'center'
    },
    link: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
        color: colors.primary,
        fontSize: typography.fontSize.sm,
        textAlign: 'center'
    }
});
