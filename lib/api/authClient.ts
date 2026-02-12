// Auth API client — Supabase Auth first, then backend sync
import { supabase } from "../supabase";
import { httpClient } from "./http";
import { setToken, clearToken } from "../auth/token";
import { getErrorMessage } from "./errors";
import type { User } from "@/types";

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: "FREELANCER" | "EMPLOYER";
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
}

/**
 * Register a new user:
 * 1. Create Supabase Auth user (handles password)
 * 2. Get access token from session
 * 3. Call backend /api/auth/register to sync Prisma user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
    if (__DEV__) console.log("[AUTH] Registering user:", data.email);

    // Step 1: Supabase signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
            data: {
                display_name: data.name,
                role: data.role || "FREELANCER",
            },
        },
    });

    if (authError) {
        if (__DEV__) console.error("[AUTH] Supabase signUp error:", authError.message);
        throw new Error(authError.message);
    }

    if (!authData.session) {
        // Email confirmation required
        throw new Error("Please check your email to confirm your account.");
    }

    const accessToken = authData.session.access_token;

    // Step 2: Store token for httpClient
    await setToken(accessToken);

    // Step 3: Sync user to backend Prisma
    try {
        const response = await httpClient.post<AuthResponse>("/api/auth/register", {
            role: data.role || "FREELANCER",
            displayName: data.name,
        });

        if (__DEV__) console.log("[AUTH] Registration + backend sync successful");
        return response;
    } catch (backendError) {
        // Backend sync failed, but Supabase user exists.
        // Return a minimal user so UI doesn't crash.
        if (__DEV__) console.error("[AUTH] Backend sync failed:", backendError);
        return {
            user: {
                id: authData.user!.id,
                email: authData.user!.email || data.email,
                role: data.role || "FREELANCER",
                displayName: data.name,
            } as User,
        };
    }
}

/**
 * Login:
 * 1. Sign in with Supabase Auth
 * 2. Store access token
 * 3. Call backend /api/auth/login to sync/retrieve Prisma user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (__DEV__) console.log("[AUTH] Logging in:", credentials.email);

    // Step 1: Supabase sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
    });

    if (authError) {
        if (__DEV__) console.error("[AUTH] Supabase signIn error:", authError.message);
        throw new Error(authError.message);
    }

    if (!authData.session) {
        throw new Error("Login failed: no session returned.");
    }

    const accessToken = authData.session.access_token;

    // Step 2: Store token
    await setToken(accessToken);

    // Step 3: Sync user to backend
    try {
        const response = await httpClient.post<AuthResponse>("/api/auth/login");
        if (__DEV__) console.log("[AUTH] Login + backend sync successful");
        return response;
    } catch (backendError) {
        if (__DEV__) console.error("[AUTH] Backend sync failed:", backendError);
        return {
            user: {
                id: authData.user!.id,
                email: authData.user!.email || credentials.email,
                role: "FREELANCER",
            } as User,
        };
    }
}

/**
 * Get current user from backend
 */
export async function getMe(): Promise<User> {
    if (__DEV__) console.log("[AUTH] Fetching current user");

    // Ensure we have a current token
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        await setToken(session.access_token);
    }

    const user = await httpClient.get<User>("/api/auth/me");
    if (__DEV__) console.log("[AUTH] Current user:", user.email);
    return user;
}

/**
 * Logout — sign out of Supabase and clear stored token
 */
export async function logout(): Promise<void> {
    if (__DEV__) console.log("[AUTH] Logging out");
    await supabase.auth.signOut();
    await clearToken();
}
