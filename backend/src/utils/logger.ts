/**
 * Production-safe logger for backend
 * Only logs in development to prevent console pollution in production
 */

const isProduction = process.env.NODE_ENV === "production";

export const logger = {
    log: (...args: unknown[]) => {
        if (!isProduction) console.log(...args);
    },
    warn: (...args: unknown[]) => {
        if (!isProduction) console.warn(...args);
    },
    error: (...args: unknown[]) => {
        if (!isProduction) console.error(...args);
    },
    // Critical errors are always logged (for debugging severe production issues)
    critical: (...args: unknown[]) => {
        console.error("[CRITICAL]", ...args);
    },
};
