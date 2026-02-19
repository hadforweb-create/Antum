import { httpClient } from "./http";

// ============================================
// TYPES
// ============================================

export interface ReviewUser {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export interface Review {
    id: string;
    orderId: string;
    serviceId: string;
    rating: number;
    body: string | null;
    mediaUrls: string[];
    reply: string | null;
    repliedAt: string | null;
    createdAt: string;
    updatedAt: string;
    reviewer: ReviewUser | null;
    reviewee: ReviewUser | null;
    service: { id: string; title: string } | null;
}

export interface ReviewsResponse {
    reviews: Review[];
    avgRating: number | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateReviewInput {
    orderId: string;
    rating: number;
    body?: string;
    mediaUrls?: string[];
}

// ============================================
// API FUNCTIONS
// ============================================

export async function createReview(data: CreateReviewInput): Promise<Review> {
    return httpClient.post<Review>("/api/reviews", data);
}

export async function getServiceReviews(
    serviceId: string,
    params?: { page?: number; limit?: number }
): Promise<ReviewsResponse> {
    const sp = new URLSearchParams({ serviceId });
    if (params?.page) sp.set("page", params.page.toString());
    if (params?.limit) sp.set("limit", params.limit.toString());
    return httpClient.get<ReviewsResponse>(`/api/reviews?${sp.toString()}`);
}

export async function getUserReviews(
    userId: string,
    params?: { page?: number; limit?: number }
): Promise<ReviewsResponse> {
    const sp = new URLSearchParams({ revieweeId: userId });
    if (params?.page) sp.set("page", params.page.toString());
    if (params?.limit) sp.set("limit", params.limit.toString());
    return httpClient.get<ReviewsResponse>(`/api/reviews?${sp.toString()}`);
}

export async function getReview(id: string): Promise<Review> {
    return httpClient.get<Review>(`/api/reviews/${id}`);
}

export async function replyToReview(id: string, reply: string): Promise<Review> {
    return httpClient.post<Review>(`/api/reviews/${id}/reply`, { reply });
}
