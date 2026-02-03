import { httpClient } from "./http";
import type { Conversation, Message } from "@/types";

// ============================================
// TYPES
// ============================================

export interface ConversationResponse {
    id: string;
    createdAt: string;
    updatedAt: string;
    participants: Array<{
        id: string;
        userId: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
        };
        joinedAt: string;
    }>;
    lastMessage: {
        id: string;
        text: string;
        senderId: string;
        createdAt: string;
        sender: {
            id: string;
            email: string;
            name: string | null;
            role: string;
        };
    } | null;
}

export interface ConversationsListResponse {
    conversations: ConversationResponse[];
}

export interface MessageResponse {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
    sender: {
        id: string;
        email: string;
        name: string | null;
        role: string;
    };
}

export interface MessagesListResponse {
    messages: MessageResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Create a new conversation with another user
 * Or return existing conversation if one already exists
 */
export async function createConversation(participantId: string): Promise<ConversationResponse> {
    return httpClient.post<ConversationResponse>("/api/conversations", { participantId });
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<ConversationsListResponse> {
    return httpClient.get<ConversationsListResponse>("/api/conversations");
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<ConversationResponse> {
    return httpClient.get<ConversationResponse>(`/api/conversations/${id}`);
}

/**
 * Get messages for a conversation (paginated)
 */
export async function getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
): Promise<MessagesListResponse> {
    return httpClient.get<MessagesListResponse>(
        `/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(conversationId: string, text: string): Promise<MessageResponse> {
    return httpClient.post<MessageResponse>(`/api/conversations/${conversationId}/messages`, {
        text,
    });
}
