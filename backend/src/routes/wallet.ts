import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const withdrawSchema = z.object({
    amount: z.number().int().min(100, "Minimum withdrawal is $1.00"),
    method: z.enum(["bank", "paypal", "stripe"]).default("bank"),
    details: z.string().max(500).optional(),
});

const listTransactionsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(["ORDER_PAYMENT", "FREELANCER_EARN", "WITHDRAWAL", "REFUND", "PLATFORM_FEE"]).optional(),
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/wallet/me
 * Get current user's wallet info
 */
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        // Upsert wallet (create if doesn't exist)
        const wallet = await prisma.wallet.upsert({
            where: { userId: currentUserId },
            create: { userId: currentUserId },
            update: {},
        });

        return res.json({
            id: wallet.id,
            balance: wallet.balance,
            balanceFormatted: `$${(wallet.balance / 100).toFixed(2)}`,
            pendingBalance: wallet.pendingBalance,
            pendingBalanceFormatted: `$${(wallet.pendingBalance / 100).toFixed(2)}`,
            totalEarned: wallet.totalEarned,
            totalEarnedFormatted: `$${(wallet.totalEarned / 100).toFixed(2)}`,
            currency: wallet.currency,
            updatedAt: wallet.updatedAt.toISOString(),
        });
    } catch (error) {
        logger.error("Error getting wallet:", error);
        return res.status(500).json({ error: "Failed to get wallet" });
    }
});

/**
 * GET /api/wallet/transactions
 * Get transaction history
 */
router.get("/transactions", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const validation = listTransactionsSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid query parameters" });
        }

        const { page, limit, type } = validation.data;

        const wallet = await prisma.wallet.findUnique({
            where: { userId: currentUserId },
            select: { id: true },
        });

        if (!wallet) {
            return res.json({
                transactions: [],
                pagination: { page, limit, total: 0, totalPages: 0 },
            });
        }

        const where: any = { walletId: wallet.id };
        if (type) where.type = type;

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    order: {
                        select: { id: true, service: { select: { title: true } } },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ]);

        return res.json({
            transactions: transactions.map((tx) => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                amountFormatted: `$${(tx.amount / 100).toFixed(2)}`,
                fee: tx.fee,
                net: tx.net,
                netFormatted: `$${(tx.net / 100).toFixed(2)}`,
                currency: tx.currency,
                status: tx.status,
                description: tx.description,
                processedAt: tx.processedAt?.toISOString() ?? null,
                createdAt: tx.createdAt.toISOString(),
                order: tx.order ? {
                    id: tx.order.id,
                    serviceTitle: tx.order.service?.title ?? null,
                } : null,
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Error getting transactions:", error);
        return res.status(500).json({ error: "Failed to get transactions" });
    }
});

/**
 * POST /api/wallet/withdraw
 * Request a withdrawal
 */
router.post("/withdraw", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const validation = withdrawSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { amount, method, details } = validation.data;

        const wallet = await prisma.wallet.findUnique({
            where: { userId: currentUserId },
        });

        if (!wallet) {
            return res.status(400).json({ error: "No wallet found" });
        }

        if (wallet.balance < amount) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Deduct from wallet and create withdrawal transaction
        const [, transaction] = await prisma.$transaction([
            prisma.wallet.update({
                where: { userId: currentUserId },
                data: { balance: { decrement: amount } },
            }),
            prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: "WITHDRAWAL",
                    amount,
                    fee: 0,
                    net: amount,
                    status: "PENDING",
                    description: `Withdrawal via ${method}${details ? ` — ${details}` : ""}`,
                },
            }),
        ]);

        // Notify user
        try {
            await prisma.notification.create({
                data: {
                    userId: currentUserId,
                    type: "withdrawal_processed",
                    targetType: "transaction",
                    targetId: transaction.id,
                    body: `Withdrawal of $${(amount / 100).toFixed(2)} is being processed.`,
                },
            });
        } catch (e) {
            logger.error("Failed to create withdrawal notification:", e);
        }

        return res.json({
            success: true,
            transactionId: transaction.id,
            amount,
            amountFormatted: `$${(amount / 100).toFixed(2)}`,
            status: "PENDING",
            message: "Withdrawal request submitted. Processing within 3-5 business days.",
        });
    } catch (error) {
        logger.error("Error requesting withdrawal:", error);
        return res.status(500).json({ error: "Failed to request withdrawal" });
    }
});

export default router;
