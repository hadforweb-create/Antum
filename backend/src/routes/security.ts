import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const blockSchema = z
    .object({
        userId: z.string().optional(),
        targetId: z.string().optional(), // legacy
    })
    .refine((data) => data.userId || data.targetId, {
        message: "userId is required",
    });

const reportSchema = z
    .object({
        userId: z.string().optional(),
        targetId: z.string().optional(), // legacy
        reason: z.string().min(1),
        details: z.string().optional(),
        description: z.string().optional(), // legacy
    })
    .refine((data) => data.userId || data.targetId, {
        message: "userId is required",
    });

function resolveTargetId(data: { userId?: string; targetId?: string }) {
    return data.userId || data.targetId || "";
}

// Block a user
router.post("/block", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const validation = blockSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const targetId = resolveTargetId(validation.data);

        if (!targetId) {
            return res.status(400).json({ error: "userId is required" });
        }

        if (userId === targetId) {
            return res.status(400).json({ error: "Cannot block yourself" });
        }

        await prisma.block.create({
            data: {
                blockerId: userId,
                blockedId: targetId,
            },
        });

        return res.json({ success: true, message: "User blocked" });
    } catch (error) {
        // Unique constraint violation means already blocked
        return res.json({ success: true, message: "User blocked" });
    }
});

// Unblock a user (required: DELETE /api/security/block/:userId)
router.delete("/block/:userId", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const targetId = req.params.userId;

        await prisma.block.deleteMany({
            where: {
                blockerId: userId,
                blockedId: targetId,
            },
        });

        return res.json({ success: true, message: "User unblocked" });
    } catch (error) {
        return res.status(500).json({ error: "Failed to unblock user" });
    }
});

// Legacy unblock endpoint (POST /api/security/unblock)
router.post("/unblock", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const validation = blockSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const targetId = resolveTargetId(validation.data);

        await prisma.block.deleteMany({
            where: {
                blockerId: userId,
                blockedId: targetId,
            },
        });

        return res.json({ success: true, message: "User unblocked" });
    } catch (error) {
        return res.status(500).json({ error: "Failed to unblock user" });
    }
});

// Report a user
router.post("/report", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const validation = reportSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const targetId = resolveTargetId(validation.data);
        const details = validation.data.details || validation.data.description;

        if (!targetId) {
            return res.status(400).json({ error: "userId is required" });
        }

        await prisma.report.create({
            data: {
                reporterId: userId,
                reportedId: targetId,
                reason: validation.data.reason,
                description: details,
            },
        });

        return res.json({ success: true, message: "Report submitted" });
    } catch (error) {
        return res.status(500).json({ error: "Failed to report user" });
    }
});

export default router;
