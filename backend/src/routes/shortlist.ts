import { logger } from "../utils/logger";
import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const addToShortlistSchema = z.object({
    targetId: z.string().min(1, "Target user ID is required"),
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/shortlist
 * Get all shortlisted users for current user
 */
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const shortlist = await prisma.shortlist.findMany({
            where: { userId: currentUserId },
            include: {
                target: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        bio: true,
                        location: true,
                        role: true,
                        _count: {
                            select: {
                                services: { where: { isActive: true } },
                                reels: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const formatted = shortlist.map((item) => ({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
            user: {
                id: item.target.id,
                name: item.target.name,
                email: item.target.email,
                avatarUrl: item.target.avatarUrl,
                bio: item.target.bio,
                location: item.target.location,
                role: item.target.role,
                servicesCount: item.target._count.services,
                reelsCount: item.target._count.reels,
            },
        }));

        return res.json({ shortlist: formatted });
    } catch (error) {
        logger.error("Error getting shortlist:", error);
        return res.status(500).json({ error: "Failed to get shortlist" });
    }
});

/**
 * POST /api/shortlist
 * Add a user to shortlist
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;

        const validation = addToShortlistSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid request",
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { targetId } = validation.data;

        // Can't shortlist yourself
        if (targetId === currentUserId) {
            return res.status(400).json({ error: "Cannot shortlist yourself" });
        }

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true },
        });

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if already shortlisted
        const existing = await prisma.shortlist.findUnique({
            where: {
                userId_targetId: {
                    userId: currentUserId,
                    targetId,
                },
            },
        });

        if (existing) {
            return res.status(409).json({ error: "User already in shortlist" });
        }

        // Create shortlist entry
        const shortlistEntry = await prisma.shortlist.create({
            data: {
                userId: currentUserId,
                targetId,
            },
            include: {
                target: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        bio: true,
                        location: true,
                        role: true,
                    },
                },
            },
        });

        return res.status(201).json({
            id: shortlistEntry.id,
            createdAt: shortlistEntry.createdAt.toISOString(),
            user: {
                id: shortlistEntry.target.id,
                name: shortlistEntry.target.name,
                email: shortlistEntry.target.email,
                avatarUrl: shortlistEntry.target.avatarUrl,
                bio: shortlistEntry.target.bio,
                location: shortlistEntry.target.location,
                role: shortlistEntry.target.role,
            },
        });
    } catch (error) {
        logger.error("Error adding to shortlist:", error);
        return res.status(500).json({ error: "Failed to add to shortlist" });
    }
});

/**
 * GET /api/shortlist/:targetId/check
 * Check if a user is in shortlist
 */
router.get("/:targetId/check", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { targetId } = req.params;

        const existing = await prisma.shortlist.findUnique({
            where: {
                userId_targetId: {
                    userId: currentUserId,
                    targetId,
                },
            },
        });

        return res.json({ shortlisted: !!existing });
    } catch (error) {
        logger.error("Error checking shortlist:", error);
        return res.status(500).json({ error: "Failed to check shortlist" });
    }
});

/**
 * DELETE /api/shortlist/:targetId
 * Remove a user from shortlist
 */
router.delete("/:targetId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user!.userId;
        const { targetId } = req.params;

        // Check if exists
        const existing = await prisma.shortlist.findUnique({
            where: {
                userId_targetId: {
                    userId: currentUserId,
                    targetId,
                },
            },
        });

        if (!existing) {
            return res.status(404).json({ error: "User not in shortlist" });
        }

        // Delete
        await prisma.shortlist.delete({
            where: {
                userId_targetId: {
                    userId: currentUserId,
                    targetId,
                },
            },
        });

        return res.json({ success: true, message: "Removed from shortlist" });
    } catch (error) {
        logger.error("Error removing from shortlist:", error);
        return res.status(500).json({ error: "Failed to remove from shortlist" });
    }
});

export default router;
