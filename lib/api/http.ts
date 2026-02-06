// HTTP Client for API requests with timeout support
// React Native compatible - NO DOMException usage
import { API_URL } from "../config";
import { getToken, clearToken } from "../auth/token";
import { router } from "expo-router";

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 12000;

// Only log in development
const log = (...args: unknown[]) => {
    if (__DEV__) {
        console.log(...args);
    }
};

const logError = (...args: unknown[]) => {
    if (__DEV__) {
        console.error(...args);
    }
};

// Log API URL on startup (dev only)
if (__DEV__) {
    console.log("[HTTP] API Base URL:", API_URL);
}

/**
 * Check if an error is an abort/timeout error (React Native safe)
 */
function isAbortError(error: unknown): boolean {
    if (error && typeof error === "object") {
        const err = error as { name?: string; message?: string };
        if (err.name === "AbortError") return true;
        if (err.message && /abort/i.test(err.message)) return true;
    }
    return false;
}

/**
 * Check if an error is a network error (React Native safe)
 */
function isNetworkError(error: unknown): boolean {
    if (error && typeof error === "object") {
        const err = error as { message?: string };
        if (err.message && /network request failed/i.test(err.message)) return true;
        if (err.message && /failed to fetch/i.test(err.message)) return true;
    }
    return false;
}

/**
 * Handle 401 Unauthorized - clear auth and redirect to login
 */
async function handle401() {
    log("[HTTP] 401 Unauthorized - clearing auth and redirecting");
    await clearToken();
    // Use setTimeout to avoid navigation during render
    setTimeout(() => {
        try {
            router.replace("/(auth)/login");
        } catch (e) {
            // Navigation might fail if we're already on auth screen
            log("[HTTP] Navigation to login failed:", e);
        }
    }, 100);
}

class HttpClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async getHeaders(): Promise<Record<string, string>> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        };

        const token = await getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response, url: string): Promise<T> {
        let text = "";
        try {
            text = await response.text();
        } catch (e) {
            logError("[HTTP] Failed to read response body:", e);
        }

        log("[HTTP] Response:", {
            url: url.replace(this.baseUrl, ""),
            status: response.status,
            body: text.substring(0, 200),
        });

        if (!response.ok) {
            // Handle 401 - Unauthorized
            if (response.status === 401) {
                await handle401();
                throw new Error("Session expired. Please log in again.");
            }

            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorData = JSON.parse(text);
                errorMessage = errorData.error || errorData.message || errorMessage;

                if (__DEV__ && errorData.details) {
                    logError("[HTTP] Validation details:", errorData.details);
                }
            } catch {
                // Response wasn't JSON
            }

            throw new Error(errorMessage);
        }

        if (!text) {
            return {} as T;
        }

        try {
            return JSON.parse(text);
        } catch {
            logError("[HTTP] Failed to parse JSON:", text.substring(0, 100));
            throw new Error("Invalid response from server");
        }
    }

    private handleError(error: unknown, url: string): never {
        logError("[HTTP] Error:", { url: url.replace(this.baseUrl, ""), error });

        if (isAbortError(error)) {
            throw new Error("Request timed out. Please try again.");
        }

        if (isNetworkError(error)) {
            throw new Error("Unable to connect. Please check your internet connection.");
        }

        if (error instanceof Error) {
            throw error;
        }

        throw new Error("Something went wrong. Please try again.");
    }

    private createAbortController(): { controller: AbortController; timeoutId: ReturnType<typeof setTimeout> } {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, REQUEST_TIMEOUT);

        return { controller, timeoutId };
    }

    async get<T>(path: string): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        log("[HTTP] GET", path);

        const { controller, timeoutId } = this.createAbortController();

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: await this.getHeaders(),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return this.handleResponse<T>(response, url);
        } catch (error) {
            clearTimeout(timeoutId);
            return this.handleError(error, url);
        }
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        log("[HTTP] POST", path);

        const { controller, timeoutId } = this.createAbortController();

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: await this.getHeaders(),
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return this.handleResponse<T>(response, url);
        } catch (error) {
            clearTimeout(timeoutId);
            return this.handleError(error, url);
        }
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        log("[HTTP] PUT", path);

        const { controller, timeoutId } = this.createAbortController();

        try {
            const response = await fetch(url, {
                method: "PUT",
                headers: await this.getHeaders(),
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return this.handleResponse<T>(response, url);
        } catch (error) {
            clearTimeout(timeoutId);
            return this.handleError(error, url);
        }
    }

    async patch<T>(path: string, body?: unknown): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        log("[HTTP] PATCH", path);

        const { controller, timeoutId } = this.createAbortController();

        try {
            const response = await fetch(url, {
                method: "PATCH",
                headers: await this.getHeaders(),
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return this.handleResponse<T>(response, url);
        } catch (error) {
            clearTimeout(timeoutId);
            return this.handleError(error, url);
        }
    }

    async delete<T = void>(path: string): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        log("[HTTP] DELETE", path);

        const { controller, timeoutId } = this.createAbortController();

        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers: await this.getHeaders(),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return this.handleResponse<T>(response, url);
        } catch (error) {
            clearTimeout(timeoutId);
            return this.handleError(error, url);
        }
    }
}

export const httpClient = new HttpClient(API_URL);
