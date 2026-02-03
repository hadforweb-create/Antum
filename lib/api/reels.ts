// Reels API
import { httpClient } from "./http";
import type { Reel, ReelsResponse, CreateReelInput, UpdateReelInput } from "@/types";

interface GetReelsParams {
    cursor?: string;
    limit?: number;
}

/**
 * Get paginated reels feed
 */
export async function getReels(params: GetReelsParams = {}): Promise<ReelsResponse> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set("cursor", params.cursor);
    if (params.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = `/api/reels${query ? `?${query}` : ""}`;

    return httpClient.get<ReelsResponse>(url);
}

/**
 * Get a single reel by ID
 */
export async function getReel(id: string): Promise<Reel> {
    return httpClient.get<Reel>(`/api/reels/${id}`);
}

/**
 * Create a new reel
 */
export async function createReel(input: CreateReelInput): Promise<Reel> {
    return httpClient.post<Reel>("/api/reels", input);
}

/**
 * Update a reel (owner only)
 */
export async function updateReel(id: string, input: UpdateReelInput): Promise<Reel> {
    return httpClient.patch<Reel>(`/api/reels/${id}`, input);
}

/**
 * Delete a reel (owner only)
 */
export async function deleteReel(id: string): Promise<void> {
    return httpClient.delete(`/api/reels/${id}`);
}

/**
 * Get reels for a specific user
 */
export async function getUserReels(userId: string, params: GetReelsParams = {}): Promise<ReelsResponse> {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.set("cursor", params.cursor);
    if (params.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = `/api/users/${userId}/reels${query ? `?${query}` : ""}`;

    return httpClient.get<ReelsResponse>(url);
}
