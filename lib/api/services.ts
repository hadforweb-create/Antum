import { httpClient } from "./http";

// ============================================
// TYPES
// ============================================

export interface ServiceUser {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    location: string | null;
    bio?: string | null;
    servicesCount?: number;
    reelsCount?: number;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    price: number;
    priceFormatted: string;
    currency: string;
    category: string;
    deliveryDays: number;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    user: ServiceUser | null;
}

export interface ServicesListResponse {
    services: Service[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CategoriesResponse {
    categories: Array<{
        name: string;
        count: number;
    }>;
}

export interface CreateServiceInput {
    title: string;
    description: string;
    price: number; // in cents
    currency?: string;
    category: string;
    deliveryDays?: number;
    imageUrl?: string | null;
}

export interface UpdateServiceInput {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: string;
    deliveryDays?: number;
    imageUrl?: string | null;
    isActive?: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all services (public)
 */
export async function getServices(params?: {
    page?: number;
    limit?: number;
    category?: string;
    userId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
}): Promise<ServicesListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.category) searchParams.set("category", params.category);
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.minPrice) searchParams.set("minPrice", params.minPrice.toString());
    if (params?.maxPrice) searchParams.set("maxPrice", params.maxPrice.toString());

    const query = searchParams.toString();
    return httpClient.get<ServicesListResponse>(`/api/services${query ? `?${query}` : ""}`);
}

/**
 * Get service categories
 */
export async function getCategories(): Promise<CategoriesResponse> {
    return httpClient.get<CategoriesResponse>("/api/services/categories");
}

/**
 * Get a single service by ID
 */
export async function getService(id: string): Promise<Service> {
    return httpClient.get<Service>(`/api/services/${id}`);
}

/**
 * Create a new service
 */
export async function createService(data: CreateServiceInput): Promise<Service> {
    return httpClient.post<Service>("/api/services", data);
}

/**
 * Update a service
 */
export async function updateService(id: string, data: UpdateServiceInput): Promise<Service> {
    return httpClient.put<Service>(`/api/services/${id}`, data);
}

/**
 * Delete a service (soft delete)
 */
export async function deleteService(id: string): Promise<{ success: boolean; message: string }> {
    return httpClient.delete(`/api/services/${id}`);
}

/**
 * Get current user's services
 */
export async function getMyServices(): Promise<{ services: Service[] }> {
    return httpClient.get<{ services: Service[] }>("/api/services/user/me");
}
