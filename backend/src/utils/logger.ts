/**
 * Production-safe logger for backend
 * Info/debug logs suppressed in production, errors always logged
 */

const isProduction = process.env.NODE_ENV === "production";

export const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) console.log(...args);
    },
    warn: (...args: unknown[]) => {
        console.warn(...args);
    },
    error: (...args: unknown[]) => {
        console.error(...args);
    },
    // Critical errors are always logged (for debugging severe production issues)
    critical: (...args: unknown[]) => {
        console.error("[CRITICAL]", ...args);
    },
};
