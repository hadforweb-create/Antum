import { Router } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const updateProfileSchema = z.object({
    displayName: z.string().min(1).optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    avatarUrl: z.string().url().optional().nullable(),
    // Employer fields
    companyName: z.string().min(1).optional(),
    website: z.string().url().optional().nullable(),
    industry: z.string().optional(),
});

/**
 * GET /api/users/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                freelancerProfile: {
                    include: {
                        skills: true,
                        reels: {
                            take: 6,
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
                employerProfile: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            profile: user.freelancerProfile || user.employerProfile,
        });
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to get user" });
    }
});

/**
 * PUT /api/users/:id
 */
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
    try {
        // Only owner can update
        if (req.user!.userId !== req.params.id) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const data = updateProfileSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role === "FREELANCER") {
            const profile = await prisma.freelancerProfile.update({
                where: { userId: user.id },
                data: {
                    displayName: data.displayName,
                    bio: data.bio,
                    location: data.location,
                    avatarUrl: data.avatarUrl,
                },
            });
            res.json({ profile });
        } else {
            const profile = await prisma.employerProfile.update({
                where: { userId: user.id },
                data: {
                    companyName: data.companyName,
                    website: data.website,
                    industry: data.industry,
                    avatarUrl: data.avatarUrl,
                },
            });
            res.json({ profile });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("Update user error:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

export default router;
