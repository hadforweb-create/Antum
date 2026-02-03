// Auth API client for JWT-based authentication
import { httpClient } from "./http";
import { setToken, clearToken } from "../auth/token";
import { toast } from "../ui/toast";
import { getErrorMessage } from "./errors";
import type { User, AuthResponse } from "@/types";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: "FREELANCER" | "EMPLOYER";
}

/**
 * Register a new user
 * Backend expects: email, password, role, displayName (optional)
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
    if (__DEV__) {
        console.log("[AUTH] Registering user:", data.email);
    }

    // Build payload with all required fields
    const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role || "FREELANCER",
        displayName: data.name,
        name: data.name,
    };

    try {
        // Note: /api prefix is in the path, backend routes are /api/auth/*
        const response = await httpClient.post<AuthResponse>("/api/auth/register", payload);
        if (__DEV__) {
            console.log("[AUTH] Registration successful for:", data.email);
        }
        await setToken(response.token);
        return response;
    } catch (error) {
        const message = getErrorMessage(error);
        if (__DEV__) {
            console.error("[AUTH] Registration error:", message);
        }
        throw new Error(message);
    }
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (__DEV__) {
        console.log("[AUTH] Logging in user:", credentials.email);
    }

    const payload = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
    };

    try {
        const response = await httpClient.post<AuthResponse>("/api/auth/login", payload);
        if (__DEV__) {
            console.log("[AUTH] Login successful for:", credentials.email);
        }
        await setToken(response.token);
        return response;
    } catch (error) {
        const message = getErrorMessage(error);
        if (__DEV__) {
            console.error("[AUTH] Login error:", message);
        }
        throw new Error(message);
    }
}

/**
 * Get current authenticated user
 */
export async function getMe(): Promise<User> {
    if (__DEV__) {
        console.log("[AUTH] Fetching current user");
    }
    const user = await httpClient.get<User>("/api/auth/me");
    if (__DEV__) {
        console.log("[AUTH] Current user:", user.email);
    }
    return user;
}

/**
 * Logout - clear token
 */
export async function logout(): Promise<void> {
    if (__DEV__) {
        console.log("[AUTH] Logging out");
    }
    await clearToken();
}
