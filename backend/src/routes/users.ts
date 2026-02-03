import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const updateProfileSchema = z.object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    bio: z.string().max(500).optional().nullable(),
    location: z.string().max(100).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatUserResponse(user: any) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        role: user.role,
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
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
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
        console.error("Get current user error:", error);
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
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
                role: true,
                createdAt: true,
            },
        });

        return res.json(formatUserResponse(user));
    } catch (error) {
        console.error("Update user error:", error);
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
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
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
        console.error("Get user error:", error);
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
                        name: true,
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
        console.error("Get user reels error:", error);
        return res.status(500).json({ error: "Failed to get user reels" });
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
                name: true,
                email: true,
                avatarUrl: true,
                bio: true,
                location: true,
                role: true,
                createdAt: true,
            },
        });

        return res.json(formatUserResponse(user));
    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({ error: "Failed to update user" });
    }
});

export default router;
