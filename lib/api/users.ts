import { httpClient } from "./http";

export interface UserProfile {
    id: string;
    email: string;
    role: "FREELANCER" | "EMPLOYER";
    profile: {
        id: string;
        displayName?: string;
        companyName?: string;
        bio?: string;
        location?: string;
        avatarUrl?: string;
        skills?: { id: string; name: string }[];
        reels?: { id: string; mediaUrl: string; thumbnailUrl?: string }[];
    } | null;
}

export interface UpdateProfileData {
    displayName?: string;
    bio?: string;
    location?: string;
    avatarUrl?: string | null;
    companyName?: string;
    website?: string | null;
    industry?: string;
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<UserProfile> {
    return httpClient.get<UserProfile>(`/api/users/${userId}`);
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, data: UpdateProfileData): Promise<{ profile: any }> {
    return httpClient.put<{ profile: any }>(`/api/users/${userId}`, data);
}
