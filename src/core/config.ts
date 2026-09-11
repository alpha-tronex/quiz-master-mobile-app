/**
 * Environment configuration. `EXPO_PUBLIC_*` variables are inlined by Expo
 * at build time (see https://docs.expo.dev/guides/environment-variables/),
 * so this is the one place the rest of the app reads them from.
 *
 * Local dev default assumes the backend from `server/server.js` running on
 * its default port (3000) on the same machine as the Metro bundler.
 * `localhost` only resolves correctly from a web build or an iOS simulator;
 * a physical device or Android emulator needs EXPO_PUBLIC_API_URL set to a
 * LAN-reachable address (e.g. http://192.168.1.20:3000) in `.env.local`.
 */
const DEFAULT_DEV_API_URL = 'http://localhost:3000';

export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_URL || DEFAULT_DEV_API_URL;

export const IS_DEV: boolean = __DEV__;
