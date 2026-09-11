/**
 * Manual mock for expo-secure-store, used automatically by Jest for any
 * test that imports it (no jest.mock() call needed — see
 * https://jestjs.io/docs/manual-mocks#mocking-node-modules).
 * Backs the Keychain/Keystore API with a plain in-memory Map so
 * authStore's persistence logic can be exercised without a device.
 */
const store = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
    return store.has(key) ? (store.get(key) as string) : null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
    store.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
    store.delete(key);
}

/** Test-only helper to reset state between test cases. */
export function __clearAll(): void {
    store.clear();
}
