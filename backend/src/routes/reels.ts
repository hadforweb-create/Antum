import { logger } from "../utils/logger";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, optionalAuth, AuthRequest } from "../middleware/auth";
import { getBlockedUserIds } from "../utils/blocking";

const router = Router();

// Validation schemas
const createReelSchema = z.object({
    mediaType: z.enum(["VIDEO", "IMAGE"]),
    mediaUrl: z.string().url("Invalid media URL"),
    caption: z.string().max(500, "Caption must be 500 characters or less").optional(),
});

const updateReelSchema = z.object({
    caption: z.string().max(500, "Caption must be 500 characters or less").optional(),
});

/**
 * GET /api/reels - Feed with cursor-based pagination
 */
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
    try {
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        const blockedIds = req.user ? await getBlockedUserIds(prisma, req.user.userId) : [];
        const where = blockedIds.length ? { userId: { notIn: blockedIds } } : {};

        const reels = await prisma.reel.findMany({
            where,
            take: limit + 1, // Fetch one extra to check if there's more
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

        res.json({
            items,
            nextCursor,
            hasMore,
        });
    } catch (error) {
        logger.error("Get reels error:", error);
        res.status(500).json({ error: "Failed to get reels" });
    }
});

/**
 * GET /api/reels/:id - Single reel detail
 */
router.get("/:id", async (req, res) => {
    try {
        const reel = await prisma.reel.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        bio: true,
                        location: true,
                    },
                },
            },
        });

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        res.json(reel);
    } catch (error) {
        logger.error("Get reel error:", error);
        res.status(500).json({ error: "Failed to get reel" });
    }
});

/**
 * POST /api/reels - Create new reel
 */
router.post("/", authenticate, async (req: AuthRequest, res) => {
    try {
        const data = createReelSchema.parse(req.body);
        const userId = req.user!.userId;

        const reel = await prisma.reel.create({
            data: {
                userId,
                mediaType: data.mediaType,
                mediaUrl: data.mediaUrl,
                caption: data.caption,
            },
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

        res.status(201).json(reel);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        logger.error("Create reel error:", error);
        res.status(500).json({ error: "Failed to create reel" });
    }
});

/**
 * PATCH /api/reels/:id - Update reel (owner only)
 */
router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const data = updateReelSchema.parse(req.body);
        const userId = req.user!.userId;

        // Find the reel
        const reel = await prisma.reel.findUnique({
            where: { id: req.params.id },
        });

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        // Check ownership
        if (reel.userId !== userId) {
            return res.status(403).json({ error: "Not authorized to update this reel" });
        }

        // Update the reel
        const updated = await prisma.reel.update({
            where: { id: req.params.id },
            data: {
                caption: data.caption,
            },
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

        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        logger.error("Update reel error:", error);
        res.status(500).json({ error: "Failed to update reel" });
    }
});

/**
 * DELETE /api/reels/:id - Delete reel (owner only)
 */
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;

        const reel = await prisma.reel.findUnique({
            where: { id: req.params.id },
        });

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        // Check ownership
        if (reel.userId !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this reel" });
        }

        await prisma.reel.delete({
            where: { id: req.params.id },
        });

        res.status(204).send();
    } catch (error) {
        logger.error("Delete reel error:", error);
        res.status(500).json({ error: "Failed to delete reel" });
    }
});

export default router;
