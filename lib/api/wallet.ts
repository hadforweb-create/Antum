import { httpClient } from "./http";

// ============================================
// TYPES
// ============================================

export interface WalletInfo {
    id: string;
    balance: number;
    balanceFormatted: string;
    pendingBalance: number;
    pendingBalanceFormatted: string;
    totalEarned: number;
    totalEarnedFormatted: string;
    currency: string;
    updatedAt: string;
}

export type TransactionType =
    | "ORDER_PAYMENT"
    | "FREELANCER_EARN"
    | "WITHDRAWAL"
    | "REFUND"
    | "PLATFORM_FEE";

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    amountFormatted: string;
    fee: number;
    net: number;
    netFormatted: string;
    currency: string;
    status: TransactionStatus;
    description: string | null;
    processedAt: string | null;
    createdAt: string;
    order: {
        id: string;
        serviceTitle: string | null;
    } | null;
}

export interface TransactionsResponse {
    transactions: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface WithdrawInput {
    amount: number; // cents
    method?: "bank" | "paypal" | "stripe";
    details?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

export async function getMyWallet(): Promise<WalletInfo> {
    return httpClient.get<WalletInfo>("/api/wallet/me");
}

export async function getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: TransactionType;
}): Promise<TransactionsResponse> {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", params.page.toString());
    if (params?.limit) sp.set("limit", params.limit.toString());
    if (params?.type) sp.set("type", params.type);
    const q = sp.toString();
    return httpClient.get<TransactionsResponse>(`/api/wallet/transactions${q ? `?${q}` : ""}`);
}

export async function requestWithdrawal(data: WithdrawInput): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    amountFormatted: string;
    status: string;
    message: string;
}> {
    return httpClient.post("/api/wallet/withdraw", data);
}
