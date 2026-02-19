import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createReviewSchema = z.object({
    orderId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    body: z.string().max(2000).optional(),
    mediaUrls: z.array(z.string().url()).max(5).optional(),
});

const replySchema = z.object({
    reply: z.string().min(1).max(1000),
});

const listReviewsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    serviceId: z.string().optional(),
    revieweeId: z.string().optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatReview(review: any) {
    return {
        id: review.id,
        orderId: review.orderId,
        serviceId: review.serviceId,
        rating: review.rating,
        body: review.body,
        mediaUrls: review.mediaUrls,
        reply: review.reply,
        repliedAt: review.repliedAt?.toISOString() ?? null,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        reviewer: review.reviewer ? {
            id: review.reviewer.id,
            displayName: review.reviewer.displayName,
            avatarUrl: review.reviewer.avatarUrl,
        } : null,
        reviewee: review.reviewee ? {
            id: review.reviewee.id,
            displayName: review.reviewee.displayName,
            avatarUrl: review.reviewee.avatarUrl,
        } : null,
        service: review.service ? {
            id: review.service.id,
            title: review.service.title,
        } : null,
    };
}

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/reviews
 * Create a review (only for COMPLETED orders, one per order)
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const validation = createReviewSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { orderId, rating, body, mediaUrls } = validation.data;

        // Verify order is COMPLETED and current user is the client
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                clientId: true,
                freelancerId: true,
                serviceId: true,
                status: true,
                review: { select: { id: true } },
            },
        });

        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.clientId !== currentUserId) return res.status(403).json({ error: "Only the client can leave a review" });
        if (order.status !== "COMPLETED") return res.status(400).json({ error: "Order must be COMPLETED to review" });
        if (order.review) return res.status(400).json({ error: "Review already exists for this order" });

        const review = await prisma.review.create({
            data: {
                orderId,
                serviceId: order.serviceId,
                reviewerId: currentUserId,
                revieweeId: order.freelancerId,
                rating,
                body: body || null,
                mediaUrls: mediaUrls || [],
            },
            include: {
                reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
                reviewee: { select: { id: true, displayName: true, avatarUrl: true } },
                service: { select: { id: true, title: true } },
            },
        });

        // Notify freelancer
        try {
            await prisma.notification.create({
                data: {
                    userId: order.freelancerId,
                    actorId: currentUserId,
                    type: "review_received",
                    targetType: "review",
                    targetId: review.id,
                    body: `You received a ${rating}-star review!`,
                },
            });
        } catch (e) {
            logger.error("Failed to create review notification:", e);
        }

        return res.status(201).json(formatReview(review));
    } catch (error) {
        logger.error("Error creating review:", error);
        return res.status(500).json({ error: "Failed to create review" });
    }
});

/**
 * GET /api/reviews
 * List reviews (filter by serviceId or revieweeId)
 */
router.get("/", async (req, res: Response) => {
    try {
        const validation = listReviewsSchema.safeParse(req.query);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid query parameters" });
        }

        const { page, limit, serviceId, revieweeId } = validation.data;

        const where: any = {};
        if (serviceId) where.serviceId = serviceId;
        if (revieweeId) where.revieweeId = revieweeId;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
                    reviewee: { select: { id: true, displayName: true, avatarUrl: true } },
                    service: { select: { id: true, title: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        // Compute avg rating
        let avgRating: number | null = null;
        if (total > 0) {
            const agg = await prisma.review.aggregate({
                where,
                _avg: { rating: true },
            });
            avgRating = agg._avg.rating;
        }

        return res.json({
            reviews: reviews.map(formatReview),
            avgRating,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Error listing reviews:", error);
        return res.status(500).json({ error: "Failed to get reviews" });
    }
});

/**
 * GET /api/reviews/:id
 * Get a single review
 */
router.get("/:id", async (req, res: Response) => {
    try {
        const review = await prisma.review.findUnique({
            where: { id: req.params.id },
            include: {
                reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
                reviewee: { select: { id: true, displayName: true, avatarUrl: true } },
                service: { select: { id: true, title: true } },
            },
        });

        if (!review) return res.status(404).json({ error: "Review not found" });
        return res.json(formatReview(review));
    } catch (error) {
        logger.error("Error getting review:", error);
        return res.status(500).json({ error: "Failed to get review" });
    }
});

/**
 * POST /api/reviews/:id/reply
 * Freelancer replies to a review
 */
router.post("/:id/reply", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { id } = req.params;

        const validation = replySchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json({ error: "Reply text required" });

        const review = await prisma.review.findUnique({
            where: { id },
            select: { revieweeId: true, reply: true },
        });

        if (!review) return res.status(404).json({ error: "Review not found" });
        if (review.revieweeId !== currentUserId) return res.status(403).json({ error: "Only the reviewee can reply" });
        if (review.reply) return res.status(400).json({ error: "Reply already exists" });

        const updated = await prisma.review.update({
            where: { id },
            data: { reply: validation.data.reply, repliedAt: new Date() },
            include: {
                reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
                reviewee: { select: { id: true, displayName: true, avatarUrl: true } },
                service: { select: { id: true, title: true } },
            },
        });

        return res.json(formatReview(updated));
    } catch (error) {
        logger.error("Error replying to review:", error);
        return res.status(500).json({ error: "Failed to reply" });
    }
});

export default router;
