import {
    validateUsername,
    validatePassword,
    validateEmail,
    validatePhone,
    validateName,
    validateUserType,
    validateZipCode,
    validateRequiredFields
} from '../validators';

describe('validateUsername', () => {
    test.each([undefined, null, ''])('rejects missing username (%p)', (value) => {
        expect(validateUsername(value)).toEqual({ valid: false, error: 'Username is required' });
    });

    test('rejects a username shorter than 3 characters', () => {
        expect(validateUsername('ab')).toEqual({
            valid: false,
            error: 'Username must be at least 3 characters'
        });
    });

    test('rejects a username with non-alphanumeric characters', () => {
        expect(validateUsername('bad_name!')).toEqual({
            valid: false,
            error: 'Username may contain only letters and numbers'
        });
    });

    test('accepts a valid alphanumeric username', () => {
        expect(validateUsername('quizadmin1')).toEqual({ valid: true, error: null });
    });
});

describe('validatePassword', () => {
    test('rejects a missing password', () => {
        expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
    });

    test('rejects a password shorter than 6 characters', () => {
        expect(validatePassword('123')).toEqual({
            valid: false,
            error: 'Password must be at least 6 characters'
        });
    });

    test('accepts a password of 6+ characters', () => {
        expect(validatePassword('password123')).toEqual({ valid: true, error: null });
    });
});

describe('validateEmail', () => {
    test('rejects a missing email', () => {
        expect(validateEmail(undefined)).toEqual({ valid: false, error: 'Email is required' });
    });

    test('rejects a malformed email', () => {
        expect(validateEmail('not-an-email')).toEqual({ valid: false, error: 'Invalid email address' });
    });

    test('accepts a well-formed email', () => {
        expect(validateEmail('ada@example.com')).toEqual({ valid: true, error: null });
    });
});

describe('validatePhone', () => {
    test('rejects a missing phone number', () => {
        expect(validatePhone('')).toEqual({ valid: false, error: 'Phone number is required' });
    });

    test('rejects an incomplete phone number with a specific digit-count message', () => {
        expect(validatePhone('12345')).toEqual({
            valid: false,
            error: 'Phone number must be at least 10 digits'
        });
    });

    test('rejects a non-numeric string that fails the format regex', () => {
        // No digits at all, so the digit-count pre-check is skipped (0 is not > 0);
        // falls through to the format regex, which rejects it.
        expect(validatePhone('abcdefghij')).toEqual({
            valid: false,
            error: 'Invalid phone number format'
        });
    });

    test('accepts a standard US phone format', () => {
        expect(validatePhone('(555) 123-4567')).toEqual({ valid: true, error: null });
    });

    test('accepts a phone number with a country code', () => {
        expect(validatePhone('+1 555-123-4567')).toEqual({ valid: true, error: null });
    });
});

describe('validateName', () => {
    test('rejects a missing name with the given field label', () => {
        expect(validateName('', 'First name')).toEqual({
            valid: false,
            error: 'First name is required'
        });
    });

    test('defaults the field label to "Name" when not provided', () => {
        expect(validateName('')).toEqual({ valid: false, error: 'Name is required' });
    });

    test('rejects a single-character name', () => {
        expect(validateName('A', 'First name')).toEqual({
            valid: false,
            error: 'First name must be at least 2 characters'
        });
    });

    test('accepts a valid name', () => {
        expect(validateName('Ada', 'First name')).toEqual({ valid: true, error: null });
    });
});

describe('validateUserType', () => {
    test('rejects a missing type', () => {
        expect(validateUserType(undefined)).toEqual({
            valid: false,
            error: 'Type must be either student or admin'
        });
    });

    test('rejects a type outside {student, admin}', () => {
        expect(validateUserType('superadmin')).toEqual({
            valid: false,
            error: 'Type must be either student or admin'
        });
    });

    test.each(['student', 'admin'])('accepts %p', (type: string) => {
        expect(validateUserType(type)).toEqual({ valid: true, error: null });
    });
});

describe('validateZipCode', () => {
    test('rejects a missing zip code', () => {
        expect(validateZipCode('')).toEqual({ valid: false, error: 'Zip code is required' });
    });

    test('rejects a malformed zip code', () => {
        expect(validateZipCode('abc')).toEqual({
            valid: false,
            error: 'Invalid zip code format (use 12345 or 12345-6789)'
        });
    });

    test('accepts a 5-digit zip code', () => {
        expect(validateZipCode('90210')).toEqual({ valid: true, error: null });
    });

    test('accepts a ZIP+4 code', () => {
        expect(validateZipCode('90210-1234')).toEqual({ valid: true, error: null });
    });
});

describe('validateRequiredFields', () => {
    test('reports every missing or blank required field', () => {
        // Note: `0` is falsy in JS, so a numeric field with value 0 is also flagged as
        // missing — this matches server/utils/validators.js's `!fields[fieldName]` check
        // exactly (same behavior, faithfully ported), not a bug introduced here.
        const errors = validateRequiredFields({ title: '', questions: undefined, id: 0 }, ['title', 'questions', 'id']);

        expect(errors).toEqual(['title is required', 'questions is required', 'id is required']);
    });

    test('returns no errors when all required fields are present', () => {
        const errors = validateRequiredFields({ title: 'Islam 101', questions: [1] }, ['title', 'questions']);

        expect(errors).toEqual([]);
    });
});
