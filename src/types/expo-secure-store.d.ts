// Augments expo-secure-store's real type declarations with the extra
// `__clearAll` test helper exported only by our Jest manual mock
// (__mocks__/expo-secure-store.ts, auto-applied for any import of this
// module under Jest). The `import` below is required so TypeScript treats
// this file as a module augmentation rather than a conflicting redeclaration.
import 'expo-secure-store';

declare module 'expo-secure-store' {
    export function __clearAll(): void;
}
