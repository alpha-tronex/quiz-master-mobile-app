import type { Quiz } from './quiz';

/**
 * Ported from the Angular app's src/app/shared/models/users.ts.
 * `Admin`/`Student` wrapper classes are intentionally not ported — the
 * mobile app is student-facing-only in v1 (see MOBILE_APP_ARCHITECTURE.md,
 * "Scope (v1)") and never branches UI on `user.type`.
 */
export interface Address {
    street1: string;
    street2: string;
    street3: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export type UserType = 'admin' | 'student';

/**
 * A user as returned by the auth/admin API. `pass` and `confirmPass` are
 * form-only fields (see auth payload types below) and are never populated
 * on a fetched User — the server response for `pass` is always an empty
 * string (server/routes/authRoutes.js strips the hash before responding).
 */
export interface User {
    id: string;
    fname: string;
    lname: string;
    email: string;
    phone: string;
    address: Address;
    uname: string;
    pass: string;
    type: UserType;
    quizzes?: Quiz[];
    /** JWT, present on register/login responses; absent elsewhere. */
    token?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
