// API Error normalization
// Converts various error types to user-friendly messages

export interface NormalizedError {
    message: string;
    code?: string;
    status?: number;
    isNetworkError: boolean;
    isAuthError: boolean;
    isValidationError: boolean;
    isNotFound: boolean;
}

/**
 * Normalize any error into a user-friendly format
 */
export function normalizeError(error: unknown): NormalizedError {
    // Default error
    const normalized: NormalizedError = {
        message: "Something went wrong. Please try again.",
        isNetworkError: false,
        isAuthError: false,
        isValidationError: false,
        isNotFound: false,
    };

    if (!error) {
        return normalized;
    }

    // Handle Error instances
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Network errors
        if (
            message.includes("network") ||
            message.includes("fetch") ||
            message.includes("connect") ||
            message.includes("timeout")
        ) {
            normalized.message = "Unable to connect. Please check your internet connection.";
            normalized.isNetworkError = true;
            return normalized;
        }

        // Parse HTTP status from message if present
        const statusMatch = error.message.match(/HTTP (\d+)/i);
        if (statusMatch) {
            normalized.status = parseInt(statusMatch[1]);
        }

        // Auth errors (401)
        if (message.includes("401") || message.includes("unauthorized") || message.includes("unauthenticated")) {
            normalized.message = "Please log in to continue.";
            normalized.isAuthError = true;
            normalized.status = 401;
            return normalized;
        }

        // Forbidden (403)
        if (message.includes("403") || message.includes("forbidden")) {
            normalized.message = "You don't have permission to do this.";
            normalized.status = 403;
            return normalized;
        }

        // Not found (404)
        if (message.includes("404") || message.includes("not found")) {
            normalized.message = "The requested item was not found.";
            normalized.isNotFound = true;
            normalized.status = 404;
            return normalized;
        }

        // Validation errors (400)
        if (message.includes("validation") || message.includes("invalid")) {
            normalized.message = error.message;
            normalized.isValidationError = true;
            normalized.status = 400;
            return normalized;
        }

        // Server errors (500)
        if (message.includes("500") || message.includes("server error")) {
            normalized.message = "Server error. Please try again later.";
            normalized.status = 500;
            return normalized;
        }

        // Use the original message if it seems user-friendly
        if (error.message.length < 100 && !message.includes("http")) {
            normalized.message = error.message;
        }

        return normalized;
    }

    // Handle object with message property
    if (typeof error === "object" && error !== null && "message" in error) {
        const errObj = error as { message: string; status?: number };
        normalized.message = errObj.message;
        normalized.status = errObj.status;
        return normalized;
    }

    // Handle string
    if (typeof error === "string") {
        normalized.message = error;
        return normalized;
    }

    return normalized;
}

/**
 * Get a user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
    return normalizeError(error).message;
}

/**
 * Check if error requires re-authentication
 */
export function isAuthError(error: unknown): boolean {
    return normalizeError(error).isAuthError;
}

/**
 * Check if error is a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
    return normalizeError(error).isNetworkError;
}
