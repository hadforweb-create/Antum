// Reels API
import { httpClient } from "./http";
import type { Reel, ReelsResponse, CreateReelInput } from "@/types";

interface GetReelsParams {
    skill?: string;
    page?: number;
    limit?: number;
}

export async function getReels(params: GetReelsParams = {}): Promise<ReelsResponse> {
    const searchParams = new URLSearchParams();
    if (params.skill) searchParams.set("skill", params.skill);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = `/api/reels${query ? `?${query}` : ""}`;

    return httpClient.get<ReelsResponse>(url);
}

export async function getReel(id: string): Promise<Reel> {
    return httpClient.get<Reel>(`/api/reels/${id}`);
}

export async function createReel(input: CreateReelInput): Promise<Reel> {
    return httpClient.post<Reel>("/api/reels", input);
}

export async function deleteReel(id: string): Promise<void> {
    return httpClient.delete(`/api/reels/${id}`);
}
