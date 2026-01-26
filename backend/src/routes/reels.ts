import { Router } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, optionalAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const createReelSchema = z.object({
    mediaType: z.enum(["VIDEO", "IMAGE"]),
    mediaUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    caption: z.string().max(500).optional(),
    skillIds: z.array(z.string()).optional(),
});

/**
 * GET /api/reels - Feed with pagination
 */
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
    try {
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        const reels = await prisma.reel.findMany({
            take: limit + 1, // Fetch one extra to check if there's more
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { createdAt: "desc" },
            include: {
                freelancer: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        userId: true,
                    },
                },
                skills: {
                    select: {
                        id: true,
                        name: true,
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
        console.error("Get reels error:", error);
        res.status(500).json({ error: "Failed to get reels" });
    }
});

/**
 * GET /api/reels/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const reel = await prisma.reel.findUnique({
            where: { id: req.params.id },
            include: {
                freelancer: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                        userId: true,
                    },
                },
                skills: true,
            },
        });

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        res.json(reel);
    } catch (error) {
        console.error("Get reel error:", error);
        res.status(500).json({ error: "Failed to get reel" });
    }
});

/**
 * POST /api/reels - Create new reel
 */
router.post("/", authenticate, async (req: AuthRequest, res) => {
    try {
        const data = createReelSchema.parse(req.body);

        // Get freelancer profile
        const profile = await prisma.freelancerProfile.findUnique({
            where: { userId: req.user!.userId },
        });

        if (!profile) {
            return res.status(403).json({ error: "Only freelancers can create reels" });
        }

        const reel = await prisma.reel.create({
            data: {
                freelancerId: profile.id,
                mediaType: data.mediaType,
                mediaUrl: data.mediaUrl,
                thumbnailUrl: data.thumbnailUrl,
                caption: data.caption,
                ...(data.skillIds && {
                    skills: {
                        connect: data.skillIds.map((id) => ({ id })),
                    },
                }),
            },
            include: {
                freelancer: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                skills: true,
            },
        });

        res.status(201).json(reel);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("Create reel error:", error);
        res.status(500).json({ error: "Failed to create reel" });
    }
});

/**
 * DELETE /api/reels/:id
 */
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        const reel = await prisma.reel.findUnique({
            where: { id: req.params.id },
            include: { freelancer: true },
        });

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        // Check ownership
        if (reel.freelancer.userId !== req.user!.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await prisma.reel.delete({
            where: { id: req.params.id },
        });

        res.status(204).send();
    } catch (error) {
        console.error("Delete reel error:", error);
        res.status(500).json({ error: "Failed to delete reel" });
    }
});

export default router;
