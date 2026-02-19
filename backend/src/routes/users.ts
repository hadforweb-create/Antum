import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const updateProfileSchema = z.object({
    displayName: z.string().min(1, "Name is required").max(100).optional(),
    bio: z.string().max(500).optional().nullable(),
    location: z.string().max(100).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
    website: z.string().url().optional().nullable(),
    pushToken: z.string().max(500).optional().nullable(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatUserResponse(user: any) {
    return {
        id: user.id,
        displayName: user.displayName,
        name: user.displayName,  // backward compat
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        website: user.website ?? null,
        role: user.role,
        isPro: user.isPro ?? false,
        completedOrderCount: user.completedOrderCount ?? 0,
        createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
    };
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/users/me
 * Get current user's profile (authenticated)
 * NOTE: This route MUST come before /:id to avoid "me" being treated as an ID
 */
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
                website: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        services: { where: { isActive: true } },
                        reels: true,
                        shortlists: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const response = formatUserResponse(user);
        (response as any).servicesCount = user._count.services;
        (response as any).reelsCount = user._count.reels;
        (response as any).shortlistCount = user._count.shortlists;

        return res.json(response);
    } catch (error) {
        logger.error("Get current user error:", error);
        return res.status(500).json({ error: "Failed to get user" });
    }
});

/**
 * PATCH /api/users/me
 * Update current user's profile (authenticated)
 */
router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const validation = updateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const user = await prisma.user.update({
            where: { id: req.user!.userId },
            data: validation.data,
            select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
                website: true,
                role: true,
                createdAt: true,
            },
        });

        return res.json(formatUserResponse(user));
    } catch (error) {
        logger.error("Update user error:", error);
        return res.status(500).json({ error: "Failed to update user" });
    }
});

/**
 * GET /api/users/:id
 * Get a user's public profile
 */
router.get("/:id", async (req, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
                website: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        services: { where: { isActive: true } },
                        reels: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const response = formatUserResponse(user);
        (response as any).servicesCount = user._count.services;
        (response as any).reelsCount = user._count.reels;

        return res.json(response);
    } catch (error) {
        logger.error("Get user error:", error);
        return res.status(500).json({ error: "Failed to get user" });
    }
});

/**
 * GET /api/users/:id/reels
 * Get a user's reels with cursor-based pagination
 */
router.get("/:id/reels", async (req, res: Response) => {
    try {
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        // Verify user exists
        const userExists = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: { id: true },
        });

        if (!userExists) {
            return res.status(404).json({ error: "User not found" });
        }

        const reels = await prisma.reel.findMany({
            where: { userId: req.params.id },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        const hasMore = reels.length > limit;
        const items = hasMore ? reels.slice(0, -1) : reels;
        const nextCursor = hasMore ? items[items.length - 1]?.id : null;

        return res.json({
            items,
            nextCursor,
            hasMore,
        });
    } catch (error) {
        logger.error("Get user reels error:", error);
        return res.status(500).json({ error: "Failed to get user reels" });
    }
});

/**
 * GET /api/users/me/skills
 * Get current user's skills
 */
router.get("/me/skills", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userSkills = await prisma.userSkill.findMany({
            where: { userId: req.user!.userId },
            include: { skill: true },
        });
        return res.json({ skills: userSkills.map((us) => ({ id: us.skill.id, name: us.skill.name })) });
    } catch (error) {
        logger.error("Get skills error:", error);
        return res.status(500).json({ error: "Failed to get skills" });
    }
});

/**
 * PUT /api/users/me/skills
 * Replace current user's full skill set
 */
router.put("/me/skills", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { skillIds } = req.body;
        if (!Array.isArray(skillIds)) {
            return res.status(400).json({ error: "skillIds must be an array" });
        }

        const currentUserId = req.user!.userId;

        // Validate all skill IDs exist
        const skills = await prisma.skill.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, name: true },
        });

        if (skills.length !== skillIds.length) {
            return res.status(400).json({ error: "One or more skill IDs are invalid" });
        }

        // Replace all skills in a transaction
        await prisma.$transaction([
            prisma.userSkill.deleteMany({ where: { userId: currentUserId } }),
            prisma.userSkill.createMany({
                data: skillIds.map((skillId: string) => ({ userId: currentUserId, skillId })),
                skipDuplicates: true,
            }),
        ]);

        return res.json({ skills: skills.map((s) => ({ id: s.id, name: s.name })) });
    } catch (error) {
        logger.error("Update skills error:", error);
        return res.status(500).json({ error: "Failed to update skills" });
    }
});

/**
 * GET /api/users/:id/skills
 * Get a user's public skills
 */
router.get("/:id/skills", async (req, res: Response) => {
    try {
        const userSkills = await prisma.userSkill.findMany({
            where: { userId: req.params.id },
            include: { skill: true },
        });
        return res.json({ skills: userSkills.map((us) => ({ id: us.skill.id, name: us.skill.name })) });
    } catch (error) {
        logger.error("Get user skills error:", error);
        return res.status(500).json({ error: "Failed to get skills" });
    }
});

/**
 * GET /api/users/:id/reviews
 * Get reviews received by a user
 */
router.get("/:id/reviews", async (req, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { revieweeId: req.params.id },
                include: {
                    reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
                    service: { select: { id: true, title: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where: { revieweeId: req.params.id } }),
        ]);

        let avgRating: number | null = null;
        if (total > 0) {
            const agg = await prisma.review.aggregate({
                where: { revieweeId: req.params.id },
                _avg: { rating: true },
            });
            avgRating = agg._avg.rating;
        }

        return res.json({
            reviews: reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                body: r.body,
                mediaUrls: r.mediaUrls,
                reply: r.reply,
                repliedAt: r.repliedAt?.toISOString() ?? null,
                createdAt: r.createdAt.toISOString(),
                reviewer: r.reviewer,
                service: r.service,
            })),
            avgRating,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        logger.error("Get user reviews error:", error);
        return res.status(500).json({ error: "Failed to get reviews" });
    }
});

/**
 * PUT /api/users/:id (legacy)
 * Update user profile by ID (owner only)
 */
router.put("/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Only owner can update
        if (req.user!.userId !== req.params.id) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const validation = updateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: validation.data,
            select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
                website: true,
                role: true,
                createdAt: true,
            },
        });

        return res.json(formatUserResponse(user));
    } catch (error) {
        logger.error("Update user error:", error);
        return res.status(500).json({ error: "Failed to update user" });
    }
});

export default router;
