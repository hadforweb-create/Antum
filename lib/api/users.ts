import { httpClient } from "./http";

// ============================================
// TYPES
// ============================================

export interface User {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    role: string;
    createdAt: string;
    servicesCount?: number;
    reelsCount?: number;
    shortlistCount?: number;
}

export interface UpdateProfileData {
    name?: string;
    bio?: string | null;
    location?: string | null;
    avatarUrl?: string | null;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get a user by ID (public profile)
 */
export async function getUser(userId: string): Promise<User> {
    return httpClient.get<User>(`/api/users/${userId}`);
}

/**
 * Get current user's profile (authenticated)
 */
export async function getCurrentUser(): Promise<User> {
    return httpClient.get<User>("/api/users/me");
}

/**
 * Update current user's profile
 */
export async function updateCurrentUser(data: UpdateProfileData): Promise<User> {
    return httpClient.patch<User>("/api/users/me", data);
}

/**
 * Update user profile by ID (legacy - owner only)
 */
export async function updateUser(userId: string, data: UpdateProfileData): Promise<User> {
    return httpClient.put<User>(`/api/users/${userId}`, data);
}
