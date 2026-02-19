export type UserRole = "FREELANCER" | "EMPLOYER";
export type MediaType = "VIDEO" | "IMAGE";
export type LoadingState = "idle" | "loading" | "success" | "error";

export type ActivityCategory =
  | "Outdoors"
  | "Social"
  | "Music"
  | "Wellness"
  | "Food & Drink"
  | "Sports"
  | "Culture"
  | "Learning";

export interface AppError {
  code?: string;
  message: string;
}

export interface CategoryConfig {
  name: ActivityCategory;
  icon: string;
  color: string;
  lightBg: string;
  darkBg: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  location: string;
  date: Date;
  time: string;
  maxAttendees: number;
  attendeeCount: number;
  images: string[];
  organizerId: string;
  organizer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole | string;
  displayName?: string | null;
  username?: string | null;
  name?: string | null;         // Kept for backward compat
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  createdAt?: string;
  servicesCount?: number;
  reelsCount?: number;
  shortlistCount?: number;
}

// Simplified Reel type matching current schema
export interface Reel {
  id: string;
  userId: string;
  mediaType: MediaType;
  mediaUrl: string;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    name?: string | null;
    avatarUrl: string | null;
    bio?: string | null;
    location?: string | null;
  };
}

export interface ReelsResponse {
  items: Reel[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateReelInput {
  mediaType: MediaType;
  mediaUrl: string;
  caption?: string;
}

export interface UpdateReelInput {
  caption?: string;
}

// Conversation types (simplified for current schema)
export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: Message | null;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

// Service types
export interface Service {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  deliveryDays: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface ServicesResponse {
  items: Service[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Shortlist types
export interface ShortlistItem {
  id: string;
  targetId: string;
  createdAt: string;
  target: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
  };
}

export interface ShortlistResponse {
  items: ShortlistItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Auth types
export interface AuthResponse {
  token?: string;  // Legacy — Supabase Auth issues tokens now
  user: User;
}

// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "REVISION_REQUESTED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export interface OrderMilestone {
  id: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  dueAt?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  freelancerId: string;
  serviceId: string;
  tierId?: string | null;
  status: OrderStatus;
  price: number;
  currency: string;
  requirements?: string | null;
  conversationId?: string | null;
  deliveryDays: number;
  dueAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; displayName?: string | null; name?: string | null; avatarUrl?: string | null };
  freelancer?: { id: string; displayName?: string | null; name?: string | null; avatarUrl?: string | null };
  service?: { id: string; title: string; imageUrl?: string | null };
  tier?: { id: string; name: string; price: number } | null;
  milestones?: OrderMilestone[];
  review?: Review | null;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface Review {
  id: string;
  orderId: string;
  serviceId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  body?: string | null;
  mediaUrls?: string[];
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  reviewer?: { id: string; displayName?: string | null; name?: string | null; avatarUrl?: string | null };
  service?: { id: string; title: string };
}

// ============================================
// WALLET & TRANSACTION TYPES
// ============================================

export type TransactionType =
  | "ORDER_PAYMENT"
  | "FREELANCER_EARN"
  | "WITHDRAWAL"
  | "REFUND"
  | "PLATFORM_FEE";

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";

export interface WalletInfo {
  id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  currency: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  orderId?: string | null;
  type: TransactionType;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  status: TransactionStatus;
  description?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  actorId?: string | null;
  type: string;
  targetType?: string | null;
  targetId?: string | null;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}
