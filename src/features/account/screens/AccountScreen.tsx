import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, Select, TextField } from '../../../shared/components';
import { colors, spacing, typography } from '../../../shared/theme';
import { validateForm, fieldErrorMap } from '../../../shared/validation';
import { useAuthStore } from '../../../core/auth/authStore';
import { useUpdateAccount } from '../hooks/useUpdateAccount';
import { useStates } from '../hooks/useStates';
import { useCountries } from '../hooks/useCountries';
import type { Address } from '../../../shared/types';

/**
 * Coalesces every field individually rather than `{ ...EMPTY_ADDRESS, ...address }`,
 * because legacy user records can have a field explicitly set to `null` (not just
 * absent) — a plain object spread would let that `null` through and crash the
 * `.trim()` calls in `handleSave`, or make a `TextField` a React "controlled input
 * received null" warning.
 */
function normalizeAddress(address: Partial<Address> | null | undefined): Address {
    return {
        street1: address?.street1 ?? '',
        street2: address?.street2 ?? '',
        street3: address?.street3 ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
        zipCode: address?.zipCode ?? '',
        country: address?.country ?? ''
    };
}

/**
 * `PUT /api/user/update` via `useUpdateAccount`. Field set mirrors the web
 * app's `account.component.html` exactly: fname/lname/email/phone plus the
 * full seven-part address (street1-3, city, state, zip, country), with
 * State/Country as dropdowns sourced from `GET /api/utils/{states,countries}`
 * (see `useStates`/`useCountries`) rather than a hardcoded list, so the
 * options can't drift from the server's canonical set.
 *
 * Every field is optional both here and server-side — `validateForm` only
 * checks format when a value is present, matching the backend's
 * partial-update semantics (and the web app's `ValidationService`). Editing
 * any field clears the "Account updated" banner so a stale success message
 * can't linger over an unsaved change.
 *
 * Username and account type are intentionally not shown: `PUT
 * /api/user/update` doesn't accept either (they aren't editable), and
 * MOBILE_APP_ARCHITECTURE.md's "no role branching" rule keeps `user.type`
 * out of this screen's UI entirely.
 */
export function AccountScreen() {
    const user = useAuthStore((state) => state.user);
    const clearSession = useAuthStore((state) => state.clearSession);
    const updateAccount = useUpdateAccount();
    const statesQuery = useStates();
    const countriesQuery = useCountries();

    const [fname, setFname] = useState(user?.fname ?? '');
    const [lname, setLname] = useState(user?.lname ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [address, setAddress] = useState<Address>(normalizeAddress(user?.address));
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [justSaved, setJustSaved] = useState(false);

    function updateField<T>(setter: (value: T) => void) {
        return (value: T) => {
            setJustSaved(false);
            setter(value);
        };
    }

    function updateAddressField<K extends keyof Address>(key: K, value: Address[K]) {
        setJustSaved(false);
        setAddress((prev) => ({ ...prev, [key]: value }));
    }

    function handleSave() {
        if (!user) {
            return;
        }

        const result = validateForm({ fname, lname, email, phone, zipCode: address.zipCode });
        const errors = fieldErrorMap(result);

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        updateAccount.mutate(
            {
                id: user.id,
                fname: fname.trim(),
                lname: lname.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: {
                    ...address,
                    street1: (address.street1 ?? '').trim(),
                    street2: (address.street2 ?? '').trim(),
                    street3: (address.street3 ?? '').trim(),
                    city: (address.city ?? '').trim(),
                    zipCode: (address.zipCode ?? '').trim()
                }
            },
            { onSuccess: () => setJustSaved(true) }
        );
    }

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.title} accessibilityRole="header">Account</Text>

                {updateAccount.isError ? (
                    <Banner message={updateAccount.error.message} variant="error" testID="account-error-banner" />
                ) : null}
                {justSaved ? (
                    <Banner message="Account updated" variant="success" testID="account-success-banner" />
                ) : null}

                <TextField
                    testID="account-fname-input"
                    label="First name"
                    value={fname}
                    onChangeText={updateField(setFname)}
                    error={fieldErrors.fname}
                />
                <TextField
                    testID="account-lname-input"
                    label="Last name"
                    value={lname}
                    onChangeText={updateField(setLname)}
                    error={fieldErrors.lname}
                />
                <TextField
                    testID="account-email-input"
                    label="Email"
                    value={email}
                    onChangeText={updateField(setEmail)}
                    error={fieldErrors.email}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                />
                <TextField
                    testID="account-phone-input"
                    label="Phone"
                    value={phone}
                    onChangeText={updateField(setPhone)}
                    error={fieldErrors.phone}
                    keyboardType="phone-pad"
                />

                <Text style={styles.sectionTitle} accessibilityRole="header">Address</Text>

                <TextField
                    testID="account-street1-input"
                    label="Street 1"
                    value={address.street1}
                    onChangeText={(text) => updateAddressField('street1', text)}
                />
                <TextField
                    testID="account-street2-input"
                    label="Street 2"
                    value={address.street2}
                    onChangeText={(text) => updateAddressField('street2', text)}
                />
                <TextField
                    testID="account-street3-input"
                    label="Street 3"
                    value={address.street3}
                    onChangeText={(text) => updateAddressField('street3', text)}
                />
                <TextField
                    testID="account-city-input"
                    label="City"
                    value={address.city}
                    onChangeText={(text) => updateAddressField('city', text)}
                />
                <Select
                    testID="account-state-select"
                    label="State"
                    value={address.state}
                    onValueChange={(value) => updateAddressField('state', value)}
                    options={(statesQuery.data ?? []).map((state) => ({ value: state.code, label: state.name }))}
                    placeholder="Select state"
                />
                <TextField
                    testID="account-zip-input"
                    label="Zip code"
                    value={address.zipCode}
                    onChangeText={(text) => updateAddressField('zipCode', text)}
                    error={fieldErrors.zipCode}
                    placeholder="12345 or 12345-6789"
                    keyboardType="number-pad"
                />
                <Select
                    testID="account-country-select"
                    label="Country"
                    value={address.country}
                    onValueChange={(value) => updateAddressField('country', value)}
                    options={(countriesQuery.data ?? []).map((country) => ({ value: country.code, label: country.name }))}
                    placeholder="Select country"
                />

                <Button
                    testID="account-save-button"
                    label="Save changes"
                    onPress={handleSave}
                    loading={updateAccount.isPending}
                    style={styles.saveButton}
                />
                <Button
                    testID="account-logout-button"
                    label="Log out"
                    variant="danger"
                    onPress={() => {
                        void clearSession();
                    }}
                    style={styles.logoutButton}
                />
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
        marginBottom: spacing.sm,
        marginTop: spacing.sm
    },
    saveButton: {
        marginTop: spacing.md
    },
    logoutButton: {
        marginTop: spacing.md,
        marginBottom: spacing.xl
    }
});
