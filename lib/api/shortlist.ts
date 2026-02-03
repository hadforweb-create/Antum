import { httpClient } from "./http";

// ============================================
// TYPES
// ============================================

export interface ShortlistUser {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    role: string;
    servicesCount?: number;
    reelsCount?: number;
}

export interface ShortlistItem {
    id: string;
    createdAt: string;
    user: ShortlistUser;
}

export interface ShortlistResponse {
    shortlist: ShortlistItem[];
}

export interface CheckShortlistResponse {
    shortlisted: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all shortlisted users
 */
export async function getShortlist(): Promise<ShortlistResponse> {
    return httpClient.get<ShortlistResponse>("/api/shortlist");
}

/**
 * Add a user to shortlist
 */
export async function addToShortlist(targetId: string): Promise<ShortlistItem> {
    return httpClient.post<ShortlistItem>("/api/shortlist", { targetId });
}

/**
 * Remove a user from shortlist
 */
export async function removeFromShortlist(targetId: string): Promise<{ success: boolean; message: string }> {
    return httpClient.delete(`/api/shortlist/${targetId}`);
}

/**
 * Check if a user is in shortlist
 */
export async function checkShortlist(targetId: string): Promise<CheckShortlistResponse> {
    return httpClient.get<CheckShortlistResponse>(`/api/shortlist/${targetId}/check`);
}
