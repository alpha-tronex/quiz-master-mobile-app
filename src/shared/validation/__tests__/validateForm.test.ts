import { validateForm, fieldErrorMap } from '../validateForm';

describe('validateForm', () => {
    test('is valid for a fully well-formed registration payload', () => {
        const result = validateForm({
            uname: 'quizadmin1',
            pass: 'password123',
            email: 'ada@example.com',
            phone: '(555) 123-4567',
            fname: 'Ada',
            lname: 'Lovelace',
            type: 'student',
            zipCode: '90210'
        });

        expect(result).toEqual({ valid: true, errors: [], invalidFields: [] });
    });

    test('only validates fields present on the input (partial-update form)', () => {
        const result = validateForm({ fname: 'Ada' });

        expect(result).toEqual({ valid: true, errors: [], invalidFields: [] });
    });

    test('does not validate a field that is undefined', () => {
        const result = validateForm({ uname: 'quizadmin1' });

        expect(result.invalidFields).not.toContain('email');
        expect(result.invalidFields).not.toContain('phone');
    });

    test('skips email, phone, fname, lname and zipCode when blank/whitespace (treated as optional-if-absent)', () => {
        const result = validateForm({ email: '', phone: '   ', fname: '', lname: '', zipCode: '' });

        expect(result).toEqual({ valid: true, errors: [], invalidFields: [] });
    });

    test('validates uname, pass and type even when empty, since they are always required if present', () => {
        const result = validateForm({ uname: '', pass: '', type: '' });

        expect(result.valid).toBe(false);
        expect(result.invalidFields).toEqual(['uname', 'pass', 'type']);
        expect(result.errors).toEqual([
            'Username is required',
            'Password is required',
            'Type must be either student or admin'
        ]);
    });

    test('accumulates errors and invalidFields across multiple failing fields', () => {
        const result = validateForm({
            uname: 'ab',
            pass: '123',
            email: 'not-an-email',
            phone: '555',
            fname: 'A',
            lname: 'B',
            type: 'superadmin',
            zipCode: 'abc'
        });

        expect(result.valid).toBe(false);
        expect(result.invalidFields).toEqual([
            'uname',
            'pass',
            'email',
            'phone',
            'fname',
            'lname',
            'type',
            'zipCode'
        ]);
        expect(result.errors).toHaveLength(8);
    });

    test('reports only the fields that fail when others are valid', () => {
        const result = validateForm({
            uname: 'quizadmin1',
            pass: 'password123',
            email: 'not-an-email'
        });

        expect(result).toEqual({
            valid: false,
            errors: ['Invalid email address'],
            invalidFields: ['email']
        });
    });

    test('returns valid with no errors for an empty input object', () => {
        const result = validateForm({});

        expect(result).toEqual({ valid: true, errors: [], invalidFields: [] });
    });
});

describe('fieldErrorMap', () => {
    test('maps each invalid field to its corresponding error message', () => {
        const result = validateForm({ uname: '', pass: '', email: 'not-an-email' });

        expect(fieldErrorMap(result)).toEqual({
            uname: 'Username is required',
            pass: 'Password is required',
            email: 'Invalid email address'
        });
    });

    test('returns an empty object when the form is fully valid', () => {
        const result = validateForm({ uname: 'quizadmin1', pass: 'password123' });

        expect(fieldErrorMap(result)).toEqual({});
    });

    test('returns an empty object for an empty input object', () => {
        expect(fieldErrorMap(validateForm({}))).toEqual({});
    });
});
