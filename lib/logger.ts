/**
 * Frontend logger utility that guards console output behind __DEV__.
 * Use this instead of raw console.log/warn/error to prevent 
 * console output in production builds.
 */
export const logger = {
    log: (...args: unknown[]): void => {
        if (__DEV__) {
            console.log(...args);
        }
    },
    warn: (...args: unknown[]): void => {
        if (__DEV__) {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]): void => {
        if (__DEV__) {
            console.error(...args);
        }
    },
};
