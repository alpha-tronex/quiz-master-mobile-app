/**
 * Ported from server/utils/validators.js (the canonical rule set — see
 * MOBILE_APP_ARCHITECTURE.md, "Validation") and cross-checked against the
 * Angular app's src/app/shared/services/validation.service.ts.
 *
 * One deliberate deviation from validators.js, kept from the Angular
 * version: `validatePhone` rejects an incomplete digit string
 * ("Phone number must be at least 10 digits") before falling through to
 * the full format regex. This is strictly an earlier, clearer message for
 * the same rejection — anything short enough to trip this check also
 * fails the format regex below, so it never accepts or rejects a phone
 * number the backend would decide differently on. See
 * MOBILE_APP_ARCHITECTURE.md for the full note on this three-way
 * (backend/web/mobile) validation duplication and the plan to consolidate
 * it into one shared package later.
 */

export interface ValidationResult {
    valid: boolean;
    error: string | null;
}

export function validateUsername(username: unknown): ValidationResult {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();

    if (trimmed.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }

    if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
        return { valid: false, error: 'Username may contain only letters and numbers' };
    }

    return { valid: true, error: null };
}

export function validatePassword(password: unknown): ValidationResult {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters' };
    }

    return { valid: true, error: null };
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{3,}$/;

export function validateEmail(email: unknown): ValidationResult {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }

    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, error: 'Invalid email address' };
    }

    return { valid: true, error: null };
}

const PHONE_REGEX = /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

export function validatePhone(phone: unknown): ValidationResult {
    if (!phone || typeof phone !== 'string') {
        return { valid: false, error: 'Phone number is required' };
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        return { valid: false, error: 'Phone number must be at least 10 digits' };
    }

    if (!PHONE_REGEX.test(phone)) {
        return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true, error: null };
}

export function validateName(name: unknown, fieldName = 'Name'): ValidationResult {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: `${fieldName} is required` };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
        return { valid: false, error: `${fieldName} must be at least 2 characters` };
    }

    return { valid: true, error: null };
}

export function validateUserType(type: unknown): ValidationResult {
    const validTypes = ['student', 'admin'];

    if (!type || typeof type !== 'string' || !validTypes.includes(type)) {
        return { valid: false, error: 'Type must be either student or admin' };
    }

    return { valid: true, error: null };
}

const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export function validateZipCode(zipCode: unknown): ValidationResult {
    if (!zipCode || typeof zipCode !== 'string') {
        return { valid: false, error: 'Zip code is required' };
    }

    if (!ZIP_REGEX.test(zipCode.trim())) {
        return { valid: false, error: 'Invalid zip code format (use 12345 or 12345-6789)' };
    }

    return { valid: true, error: null };
}

export function validateRequiredFields(
    fields: Record<string, unknown>,
    requiredFields: string[]
): string[] {
    const errors: string[] = [];

    requiredFields.forEach((fieldName) => {
        const value = fields[fieldName];
        if (!value || (typeof value === 'string' && !value.trim())) {
            errors.push(`${fieldName} is required`);
        }
    });

    return errors;
}
