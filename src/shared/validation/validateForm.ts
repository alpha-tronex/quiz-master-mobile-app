import {
    validateUsername,
    validatePassword,
    validateEmail,
    validatePhone,
    validateName,
    validateUserType,
    validateZipCode
} from './validators';

/**
 * Ported from ValidationService.validateForm() in the Angular app
 * (src/app/shared/services/validation.service.ts). Runs whichever
 * per-field validators apply to the fields actually present on
 * `formData`, so it works for both the registration form (all fields)
 * and partial-update forms (only the fields being edited).
 */
export interface FormValidationInput {
    uname?: string;
    pass?: string;
    email?: string;
    phone?: string;
    fname?: string;
    lname?: string;
    type?: string;
    zipCode?: string;
}

export interface FormValidationResult {
    valid: boolean;
    errors: string[];
    invalidFields: string[];
}

export function validateForm(formData: FormValidationInput): FormValidationResult {
    const errors: string[] = [];
    const invalidFields: string[] = [];

    const record = (field: string, result: { valid: boolean; error: string | null }) => {
        if (!result.valid && result.error) {
            errors.push(result.error);
            invalidFields.push(field);
        }
    };

    if (formData.uname !== undefined) {
        record('uname', validateUsername(formData.uname));
    }

    if (formData.pass !== undefined) {
        record('pass', validatePassword(formData.pass));
    }

    if (formData.email !== undefined && formData.email && formData.email.trim()) {
        record('email', validateEmail(formData.email));
    }

    if (formData.phone !== undefined && formData.phone && formData.phone.trim()) {
        record('phone', validatePhone(formData.phone));
    }

    if (formData.fname !== undefined && formData.fname && formData.fname.trim()) {
        record('fname', validateName(formData.fname, 'First name'));
    }

    if (formData.lname !== undefined && formData.lname && formData.lname.trim()) {
        record('lname', validateName(formData.lname, 'Last name'));
    }

    if (formData.type !== undefined) {
        record('type', validateUserType(formData.type));
    }

    if (formData.zipCode !== undefined && formData.zipCode && formData.zipCode.trim()) {
        record('zipCode', validateZipCode(formData.zipCode));
    }

    return {
        valid: errors.length === 0,
        errors,
        invalidFields
    };
}
