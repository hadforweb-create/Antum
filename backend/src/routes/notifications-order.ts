import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * GET /api/notifications/order
 * Get order/transactional notifications for current user
 */
router.get("/order", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
        const unreadOnly = req.query.unreadOnly === "true";

        const where: any = { userId: currentUserId };
        if (unreadOnly) where.isRead = false;

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: { userId: currentUserId, isRead: false },
            }),
        ]);

        return res.json({
            notifications: notifications.map((n) => ({
                id: n.id,
                type: n.type,
                body: n.body,
                targetType: n.targetType,
                targetId: n.targetId,
                actorId: n.actorId,
                isRead: n.isRead,
                readAt: n.readAt?.toISOString() ?? null,
                createdAt: n.createdAt.toISOString(),
            })),
            unreadCount,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Error getting notifications:", error);
        return res.status(500).json({ error: "Failed to get notifications" });
    }
});

/**
 * POST /api/notifications/order/:id/read
 * Mark a single notification as read
 */
router.post("/order/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!notification) return res.status(404).json({ error: "Notification not found" });
        if (notification.userId !== currentUserId) return res.status(403).json({ error: "Not authorized" });

        await prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });

        return res.json({ success: true });
    } catch (error) {
        logger.error("Error marking notification read:", error);
        return res.status(500).json({ error: "Failed to mark notification read" });
    }
});

/**
 * POST /api/notifications/order/read-all
 * Mark all order notifications as read
 */
router.post("/order/read-all", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const result = await prisma.notification.updateMany({
            where: { userId: currentUserId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });

        return res.json({ success: true, count: result.count });
    } catch (error) {
        logger.error("Error marking all notifications read:", error);
        return res.status(500).json({ error: "Failed to mark notifications read" });
    }
});

export default router;
