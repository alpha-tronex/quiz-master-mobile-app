import { IS_DEV } from './config';

/**
 * Mirrors src/app/core/services/logger.service.ts from the Angular app:
 * a leveled console wrapper so log verbosity can be dialed down in
 * production without scattering `if (__DEV__)` checks through the codebase.
 * No Angular DI equivalent here — it's a plain module-level singleton.
 */
export type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'off';

const LOG_LEVEL_ORDER: Record<LogLevelName, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    off: 100
};

const level = LOG_LEVEL_ORDER[IS_DEV ? 'debug' : 'warn'];

function debug(message: string, ...args: unknown[]): void {
    if (level <= LOG_LEVEL_ORDER.debug) {
        console.debug(`[DEBUG] ${message}`, ...args);
    }
}

function info(message: string, ...args: unknown[]): void {
    if (level <= LOG_LEVEL_ORDER.info) {
        console.info(`[INFO] ${message}`, ...args);
    }
}

function warn(message: string, ...args: unknown[]): void {
    if (level <= LOG_LEVEL_ORDER.warn) {
        console.warn(`[WARN] ${message}`, ...args);
    }
}

function error(message: string, ...args: unknown[]): void {
    if (level <= LOG_LEVEL_ORDER.error) {
        console.error(`[ERROR] ${message}`, ...args);
    }
}

export const logger = { debug, info, warn, error };
