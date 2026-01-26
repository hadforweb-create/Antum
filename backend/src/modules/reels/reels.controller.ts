// Reels Controller
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../prisma.js";
import { AuthRequest } from "../../middleware/auth.js";
import { MediaType } from "@prisma/client";

// GET /api/reels
export async function getReels(req: Request, res: Response, next: NextFunction) {
    try {
        const { skill, page = "1", limit = "10" } = req.query;

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * limitNum;

        const where = skill
            ? { skills: { some: { slug: skill as string } } }
            : {};

        const [reels, total] = await Promise.all([
            prisma.reel.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: "desc" },
                include: {
                    skills: true,
                    freelancer: {
                        include: {
                            user: { select: { id: true } },
                        },
                    },
                },
            }),
            prisma.reel.count({ where }),
        ]);

        // Transform to include userId
        const transformedReels = reels.map((reel) => ({
            ...reel,
            freelancer: {
                id: reel.freelancer.id,
                userId: reel.freelancer.user.id,
                displayName: reel.freelancer.displayName,
                avatarUrl: reel.freelancer.avatarUrl,
                location: reel.freelancer.location,
                bio: reel.freelancer.bio,
            },
        }));

        res.json({
            reels: transformedReels,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/reels/:id
export async function getReel(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;

        const reel = await prisma.reel.findUnique({
            where: { id },
            include: {
                skills: true,
                freelancer: {
                    include: {
                        user: { select: { id: true } },
                        skills: true,
                    },
                },
            },
        });

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        res.json({
            ...reel,
            freelancer: {
                id: reel.freelancer.id,
                userId: reel.freelancer.user.id,
                displayName: reel.freelancer.displayName,
                avatarUrl: reel.freelancer.avatarUrl,
                location: reel.freelancer.location,
                bio: reel.freelancer.bio,
                skills: reel.freelancer.skills,
            },
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/reels
export async function createReel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id;
        const { mediaType, mediaUrl, thumbnailUrl, caption, skillIds } = req.body;

        // Validate required fields
        if (!mediaUrl || !skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
            return res.status(400).json({ error: "mediaUrl and skillIds are required" });
        }

        // Validate mediaType
        if (mediaType && !["VIDEO", "IMAGE"].includes(mediaType)) {
            return res.status(400).json({ error: "mediaType must be VIDEO or IMAGE" });
        }

        // Get freelancer profile
        const freelancer = await prisma.freelancerProfile.findUnique({
            where: { userId },
        });

        if (!freelancer) {
            return res.status(403).json({ error: "Only freelancers can create reels" });
        }

        // Create reel
        const reel = await prisma.reel.create({
            data: {
                freelancerId: freelancer.id,
                mediaType: (mediaType as MediaType) || "VIDEO",
                mediaUrl,
                thumbnailUrl,
                caption,
                skills: {
                    connect: skillIds.map((id: string) => ({ id })),
                },
            },
            include: {
                skills: true,
                freelancer: {
                    include: {
                        user: { select: { id: true } },
                    },
                },
            },
        });

        res.status(201).json({
            ...reel,
            freelancer: {
                id: reel.freelancer.id,
                userId: reel.freelancer.user.id,
                displayName: reel.freelancer.displayName,
                avatarUrl: reel.freelancer.avatarUrl,
                location: reel.freelancer.location,
            },
        });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/reels/:id
export async function deleteReel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        // Get freelancer profile
        const freelancer = await prisma.freelancerProfile.findUnique({
            where: { userId },
        });

        if (!freelancer) {
            return res.status(403).json({ error: "Only freelancers can delete reels" });
        }

        // Check ownership
        const reel = await prisma.reel.findUnique({
            where: { id },
        });

        if (!reel) {
            return res.status(404).json({ error: "Reel not found" });
        }

        if (reel.freelancerId !== freelancer.id) {
            return res.status(403).json({ error: "You can only delete your own reels" });
        }

        await prisma.reel.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
