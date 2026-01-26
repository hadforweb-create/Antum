import { httpClient } from "./http";
import { setToken, clearToken } from "./token";

export interface AuthUser {
    id: string;
    email: string;
    role: "FREELANCER" | "EMPLOYER";
    profile: {
        id: string;
        displayName?: string;
        companyName?: string;
        bio?: string;
        avatarUrl?: string;
    } | null;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface RegisterData {
    email: string;
    password: string;
    role: "FREELANCER" | "EMPLOYER";
    displayName?: string;
    companyName?: string;
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>("/api/auth/register", data);
    await setToken(response.token);
    return response;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>("/api/auth/login", { email, password });
    await setToken(response.token);
    return response;
}

/**
 * Get current authenticated user
 */
export async function getMe(): Promise<AuthUser> {
    return httpClient.get<AuthUser>("/api/auth/me");
}

/**
 * Logout - clear token
 */
export async function logout(): Promise<void> {
    await clearToken();
}
