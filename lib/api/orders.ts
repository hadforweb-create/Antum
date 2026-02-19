import { httpClient } from "./http";

// ============================================
// TYPES
// ============================================

export type OrderStatus =
    | "PENDING"
    | "IN_PROGRESS"
    | "DELIVERED"
    | "REVISION_REQUESTED"
    | "COMPLETED"
    | "CANCELLED"
    | "DISPUTED";

export interface OrderUser {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export interface OrderService {
    id: string;
    title: string;
    imageUrl: string | null;
    category: string;
}

export interface OrderTier {
    id: string;
    name: string;
    price: number;
}

export interface OrderMilestone {
    id: string;
    title: string;
    description: string | null;
    isCompleted: boolean;
    completedAt: string | null;
    dueAt: string | null;
    createdAt: string;
}

export interface Order {
    id: string;
    status: OrderStatus;
    price: number;
    priceFormatted: string;
    currency: string;
    requirements: string | null;
    conversationId: string | null;
    deliveryDays: number;
    dueAt: string | null;
    deliveredAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
    createdAt: string;
    updatedAt: string;
    client: OrderUser | null;
    freelancer: OrderUser | null;
    service: OrderService | null;
    tier: OrderTier | null;
    milestones: OrderMilestone[];
    review: { id: string; rating: number; body: string | null } | null;
}

export interface OrdersResponse {
    orders: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateOrderInput {
    serviceId: string;
    tierId?: string;
    requirements?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

export async function createOrder(data: CreateOrderInput): Promise<Order> {
    return httpClient.post<Order>("/api/orders", data);
}

export async function getMyOrders(params?: {
    role?: "client" | "freelancer" | "all";
    status?: OrderStatus;
    page?: number;
    limit?: number;
}): Promise<OrdersResponse> {
    const sp = new URLSearchParams();
    if (params?.role) sp.set("role", params.role);
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", params.page.toString());
    if (params?.limit) sp.set("limit", params.limit.toString());
    const q = sp.toString();
    return httpClient.get<OrdersResponse>(`/api/orders${q ? `?${q}` : ""}`);
}

export async function getOrder(id: string): Promise<Order> {
    return httpClient.get<Order>(`/api/orders/${id}`);
}

export async function updateOrderStatus(
    id: string,
    status: "IN_PROGRESS" | "CANCELLED",
    cancelReason?: string
): Promise<Order> {
    return httpClient.patch<Order>(`/api/orders/${id}/status`, { status, cancelReason });
}

export async function deliverOrder(id: string, message?: string): Promise<Order> {
    return httpClient.post<Order>(`/api/orders/${id}/deliver`, { message });
}

export async function completeOrder(id: string): Promise<Order> {
    return httpClient.post<Order>(`/api/orders/${id}/complete`, {});
}

export async function requestRevision(id: string, reason: string): Promise<Order> {
    return httpClient.post<Order>(`/api/orders/${id}/request-revision`, { reason });
}

export async function cancelOrder(id: string, reason: string): Promise<Order> {
    return httpClient.post<Order>(`/api/orders/${id}/cancel`, { reason });
}

export async function getOrderMilestones(id: string): Promise<{ milestones: OrderMilestone[] }> {
    return httpClient.get<{ milestones: OrderMilestone[] }>(`/api/orders/${id}/milestones`);
}

export async function addMilestone(
    id: string,
    data: { title: string; description?: string; dueAt?: string }
): Promise<OrderMilestone> {
    return httpClient.post<OrderMilestone>(`/api/orders/${id}/milestones`, data);
}

export async function updateMilestone(
    id: string,
    mid: string,
    data: { isCompleted?: boolean; title?: string; description?: string; dueAt?: string }
): Promise<OrderMilestone> {
    return httpClient.patch<OrderMilestone>(`/api/orders/${id}/milestones/${mid}`, data);
}
