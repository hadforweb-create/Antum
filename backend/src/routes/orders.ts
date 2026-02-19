import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";
import { OrderStatus } from "@prisma/client";

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createOrderSchema = z.object({
    serviceId: z.string().min(1),
    tierId: z.string().optional(),
    requirements: z.string().max(5000).optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(["IN_PROGRESS", "CANCELLED"]),
    cancelReason: z.string().max(500).optional(),
});

const deliverOrderSchema = z.object({
    message: z.string().max(2000).optional(),
});

const requestRevisionSchema = z.object({
    reason: z.string().min(1).max(1000),
});

const cancelOrderSchema = z.object({
    reason: z.string().min(1).max(500),
});

const addMilestoneSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    dueAt: z.string().datetime().optional(),
});

const updateMilestoneSchema = z.object({
    isCompleted: z.boolean().optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    dueAt: z.string().datetime().optional(),
});

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
    PENDING: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["DELIVERED", "CANCELLED"],
    DELIVERED: ["COMPLETED", "REVISION_REQUESTED"],
    REVISION_REQUESTED: ["IN_PROGRESS", "DISPUTED"],
    COMPLETED: [],
    CANCELLED: [],
    DISPUTED: [],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatOrder(order: any) {
    return {
        id: order.id,
        status: order.status,
        price: order.price,
        priceFormatted: `$${(order.price / 100).toFixed(2)}`,
        currency: order.currency,
        requirements: order.requirements,
        conversationId: order.conversationId,
        deliveryDays: order.deliveryDays,
        dueAt: order.dueAt?.toISOString() ?? null,
        deliveredAt: order.deliveredAt?.toISOString() ?? null,
        completedAt: order.completedAt?.toISOString() ?? null,
        cancelledAt: order.cancelledAt?.toISOString() ?? null,
        cancelReason: order.cancelReason,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        client: order.client ? {
            id: order.client.id,
            displayName: order.client.displayName,
            avatarUrl: order.client.avatarUrl,
        } : null,
        freelancer: order.freelancer ? {
            id: order.freelancer.id,
            displayName: order.freelancer.displayName,
            avatarUrl: order.freelancer.avatarUrl,
        } : null,
        service: order.service ? {
            id: order.service.id,
            title: order.service.title,
            imageUrl: order.service.imageUrl,
            category: order.service.category,
        } : null,
        tier: order.tier ? {
            id: order.tier.id,
            name: order.tier.name,
            price: order.tier.price,
        } : null,
        milestones: (order.milestones ?? []).map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            isCompleted: m.isCompleted,
            completedAt: m.completedAt?.toISOString() ?? null,
            dueAt: m.dueAt?.toISOString() ?? null,
            createdAt: m.createdAt.toISOString(),
        })),
        review: order.review ? {
            id: order.review.id,
            rating: order.review.rating,
            body: order.review.body,
        } : null,
    };
}

const orderInclude = {
    client: { select: { id: true, displayName: true, avatarUrl: true } },
    freelancer: { select: { id: true, displayName: true, avatarUrl: true } },
    service: { select: { id: true, title: true, imageUrl: true, category: true } },
    tier: { select: { id: true, name: true, price: true } },
    milestones: { orderBy: { createdAt: "asc" as const } },
    review: { select: { id: true, rating: true, body: true } },
};

async function createNotification(
    userId: string,
    type: string,
    body: string,
    targetType?: string,
    targetId?: string,
    actorId?: string
) {
    try {
        await prisma.notification.create({
            data: { userId, type, body, targetType, targetId, actorId },
        });
    } catch (e) {
        logger.error("Failed to create notification:", e);
    }
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/orders
 * Create a new order (clients hire freelancers)
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const validation = createOrderSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { serviceId, tierId, requirements } = validation.data;

        // Load service
        const service = await prisma.service.findUnique({
            where: { id: serviceId, isActive: true },
            include: {
                tiers: tierId ? { where: { id: tierId, isActive: true } } : false,
            },
        });

        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }

        // Cannot hire yourself
        if (service.userId === currentUserId) {
            return res.status(400).json({ error: "You cannot hire yourself" });
        }

        // Determine price and delivery days
        let price = service.price;
        let deliveryDays = service.deliveryDays;

        if (tierId) {
            const tier = (service as any).tiers?.[0];
            if (!tier) {
                return res.status(404).json({ error: "Service tier not found" });
            }
            price = tier.price;
            deliveryDays = tier.deliveryDays;
        }

        const dueAt = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);

        // Find or create conversation between client and freelancer
        let conversationId: string | null = null;
        try {
            // Try to find existing conversation
            const existing = await prisma.conversation.findFirst({
                where: {
                    participants: {
                        every: {
                            userId: { in: [currentUserId, service.userId] },
                        },
                    },
                },
                select: { id: true },
            });

            if (existing) {
                conversationId = existing.id;
            } else {
                // Create new conversation
                const conv = await prisma.conversation.create({
                    data: {
                        participants: {
                            create: [
                                { userId: currentUserId },
                                { userId: service.userId },
                            ],
                        },
                    },
                });
                conversationId = conv.id;
            }
        } catch (e) {
            logger.error("Could not create/find conversation:", e);
        }

        const order = await prisma.order.create({
            data: {
                clientId: currentUserId,
                freelancerId: service.userId,
                serviceId,
                tierId: tierId || null,
                price,
                deliveryDays,
                dueAt,
                requirements: requirements || null,
                conversationId,
            },
            include: orderInclude,
        });

        // Notify freelancer
        await createNotification(
            service.userId,
            "order_placed",
            `You received a new order for "${service.title}"`,
            "order",
            order.id,
            currentUserId
        );

        return res.status(201).json(formatOrder(order));
    } catch (error) {
        logger.error("Error creating order:", error);
        return res.status(500).json({ error: "Failed to create order" });
    }
});

/**
 * GET /api/orders
 * Get orders for current user (as client or freelancer)
 */
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const role = (req.query.role as string) || "all"; // "client" | "freelancer" | "all"
        const status = req.query.status as string | undefined;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

        const where: any = {};

        if (role === "client") {
            where.clientId = currentUserId;
        } else if (role === "freelancer") {
            where.freelancerId = currentUserId;
        } else {
            where.OR = [{ clientId: currentUserId }, { freelancerId: currentUserId }];
        }

        if (status) {
            where.status = status;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: orderInclude,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return res.json({
            orders: orders.map(formatOrder),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Error getting orders:", error);
        return res.status(500).json({ error: "Failed to get orders" });
    }
});

/**
 * GET /api/orders/:id
 * Get a single order
 */
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: orderInclude,
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Only client or freelancer can view
        if (order.clientId !== currentUserId && order.freelancerId !== currentUserId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        return res.json(formatOrder(order));
    } catch (error) {
        logger.error("Error getting order:", error);
        return res.status(500).json({ error: "Failed to get order" });
    }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status (freelancer accepts/client cancels in PENDING)
 */
router.patch("/:id/status", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const validation = updateStatusSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid request", details: validation.error.flatten().fieldErrors });
        }

        const { status: newStatus, cancelReason } = validation.data;

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.clientId !== currentUserId && order.freelancerId !== currentUserId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Validate transition
        const allowed = STATUS_TRANSITIONS[order.status] || [];
        if (!allowed.includes(newStatus as OrderStatus)) {
            return res.status(400).json({
                error: `Cannot transition from ${order.status} to ${newStatus}`,
            });
        }

        const updateData: any = { status: newStatus };
        if (newStatus === "CANCELLED") {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = cancelReason || null;
        }

        const updated = await prisma.order.update({
            where: { id },
            data: updateData,
            include: orderInclude,
        });

        // Notify the other party
        const notifyUserId = currentUserId === order.clientId ? order.freelancerId : order.clientId;
        await createNotification(
            notifyUserId,
            "order_status_changed",
            `Order status changed to ${newStatus}`,
            "order",
            id,
            currentUserId
        );

        return res.json(formatOrder(updated));
    } catch (error) {
        logger.error("Error updating order status:", error);
        return res.status(500).json({ error: "Failed to update order status" });
    }
});

/**
 * POST /api/orders/:id/deliver
 * Freelancer marks order as delivered
 */
router.post("/:id/deliver", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const validation = deliverOrderSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid request" });
        }

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.freelancerId !== currentUserId) return res.status(403).json({ error: "Only the freelancer can deliver" });
        if (order.status !== "IN_PROGRESS") return res.status(400).json({ error: "Order must be IN_PROGRESS to deliver" });

        const updated = await prisma.order.update({
            where: { id },
            data: { status: "DELIVERED", deliveredAt: new Date() },
            include: orderInclude,
        });

        await createNotification(
            order.clientId,
            "order_status_changed",
            `Your order has been delivered! Review and accept it.`,
            "order",
            id,
            currentUserId
        );

        return res.json(formatOrder(updated));
    } catch (error) {
        logger.error("Error delivering order:", error);
        return res.status(500).json({ error: "Failed to deliver order" });
    }
});

/**
 * POST /api/orders/:id/complete
 * Client accepts delivery → completes order and credits freelancer wallet
 */
router.post("/:id/complete", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.clientId !== currentUserId) return res.status(403).json({ error: "Only the client can complete" });
        if (order.status !== "DELIVERED") return res.status(400).json({ error: "Order must be DELIVERED to complete" });

        // Platform fee = 20%
        const platformFee = Math.round(order.price * 0.2);
        const freelancerNet = order.price - platformFee;

        // Execute in transaction
        const [updated] = await prisma.$transaction([
            // Complete the order
            prisma.order.update({
                where: { id },
                data: { status: "COMPLETED", completedAt: new Date() },
            }),
            // Upsert freelancer wallet
            prisma.wallet.upsert({
                where: { userId: order.freelancerId },
                create: {
                    userId: order.freelancerId,
                    balance: freelancerNet,
                    totalEarned: freelancerNet,
                },
                update: {
                    balance: { increment: freelancerNet },
                    totalEarned: { increment: freelancerNet },
                },
            }),
            // Increment completed order count
            prisma.user.update({
                where: { id: order.freelancerId },
                data: { completedOrderCount: { increment: 1 } },
            }),
        ]);

        // Create transaction record (outside prisma transaction to avoid nesting issues)
        const wallet = await prisma.wallet.findUnique({ where: { userId: order.freelancerId } });
        if (wallet) {
            await prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    orderId: id,
                    type: "FREELANCER_EARN",
                    amount: order.price,
                    fee: platformFee,
                    net: freelancerNet,
                    status: "COMPLETED",
                    description: `Earned from order #${id.slice(-6)}`,
                    processedAt: new Date(),
                },
            });
        }

        // Notify freelancer
        await createNotification(
            order.freelancerId,
            "order_status_changed",
            `Order completed! $${(freelancerNet / 100).toFixed(2)} added to your wallet.`,
            "order",
            id,
            currentUserId
        );

        // Return full order
        const fullOrder = await prisma.order.findUnique({ where: { id }, include: orderInclude });
        return res.json(formatOrder(fullOrder));
    } catch (error) {
        logger.error("Error completing order:", error);
        return res.status(500).json({ error: "Failed to complete order" });
    }
});

/**
 * POST /api/orders/:id/request-revision
 * Client requests revision
 */
router.post("/:id/request-revision", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const validation = requestRevisionSchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json({ error: "Reason required" });

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.clientId !== currentUserId) return res.status(403).json({ error: "Only client can request revision" });
        if (order.status !== "DELIVERED") return res.status(400).json({ error: "Order must be DELIVERED" });

        const updated = await prisma.order.update({
            where: { id },
            data: { status: "REVISION_REQUESTED" },
            include: orderInclude,
        });

        await createNotification(
            order.freelancerId,
            "order_status_changed",
            `Revision requested: ${validation.data.reason}`,
            "order",
            id,
            currentUserId
        );

        return res.json(formatOrder(updated));
    } catch (error) {
        logger.error("Error requesting revision:", error);
        return res.status(500).json({ error: "Failed to request revision" });
    }
});

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
router.post("/:id/cancel", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const validation = cancelOrderSchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json({ error: "Reason required" });

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.clientId !== currentUserId && order.freelancerId !== currentUserId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const allowed = STATUS_TRANSITIONS[order.status] || [];
        if (!allowed.includes("CANCELLED" as OrderStatus)) {
            return res.status(400).json({ error: `Cannot cancel from ${order.status}` });
        }

        const updated = await prisma.order.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancelReason: validation.data.reason,
            },
            include: orderInclude,
        });

        const notifyUserId = currentUserId === order.clientId ? order.freelancerId : order.clientId;
        await createNotification(
            notifyUserId,
            "order_status_changed",
            `Order was cancelled: ${validation.data.reason}`,
            "order",
            id,
            currentUserId
        );

        return res.json(formatOrder(updated));
    } catch (error) {
        logger.error("Error cancelling order:", error);
        return res.status(500).json({ error: "Failed to cancel order" });
    }
});

/**
 * GET /api/orders/:id/milestones
 */
router.get("/:id/milestones", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            select: { clientId: true, freelancerId: true },
        });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.clientId !== currentUserId && order.freelancerId !== currentUserId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const milestones = await prisma.orderMilestone.findMany({
            where: { orderId: id },
            orderBy: { createdAt: "asc" },
        });

        return res.json({ milestones });
    } catch (error) {
        logger.error("Error getting milestones:", error);
        return res.status(500).json({ error: "Failed to get milestones" });
    }
});

/**
 * POST /api/orders/:id/milestones
 */
router.post("/:id/milestones", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const validation = addMilestoneSchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json({ error: "Invalid request" });

        const order = await prisma.order.findUnique({
            where: { id },
            select: { freelancerId: true },
        });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.freelancerId !== currentUserId) return res.status(403).json({ error: "Only freelancer can add milestones" });

        const milestone = await prisma.orderMilestone.create({
            data: {
                orderId: id,
                title: validation.data.title,
                description: validation.data.description || null,
                dueAt: validation.data.dueAt ? new Date(validation.data.dueAt) : null,
            },
        });

        return res.status(201).json(milestone);
    } catch (error) {
        logger.error("Error adding milestone:", error);
        return res.status(500).json({ error: "Failed to add milestone" });
    }
});

/**
 * PATCH /api/orders/:id/milestones/:mid
 */
router.patch("/:id/milestones/:mid", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id, mid } = req.params;

        const validation = updateMilestoneSchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json({ error: "Invalid request" });

        const order = await prisma.order.findUnique({
            where: { id },
            select: { freelancerId: true },
        });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.freelancerId !== currentUserId) return res.status(403).json({ error: "Only freelancer can update milestones" });

        const updateData: any = { ...validation.data };
        if (validation.data.isCompleted === true) {
            updateData.completedAt = new Date();
        } else if (validation.data.isCompleted === false) {
            updateData.completedAt = null;
        }
        if (validation.data.dueAt) {
            updateData.dueAt = new Date(validation.data.dueAt);
        }

        const milestone = await prisma.orderMilestone.update({
            where: { id: mid },
            data: updateData,
        });

        return res.json(milestone);
    } catch (error) {
        logger.error("Error updating milestone:", error);
        return res.status(500).json({ error: "Failed to update milestone" });
    }
});

export default router;
