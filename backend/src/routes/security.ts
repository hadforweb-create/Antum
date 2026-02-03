import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Block a user
router.post("/block", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const schema = z.object({ targetId: z.string() });
        const validation = schema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: "Invalid target ID" });
        }

        const { targetId } = validation.data;

        if (userId === targetId) {
            return res.status(400).json({ error: "Cannot block yourself" });
        }

        await prisma.block.create({
            data: {
                blockerId: userId,
                blockedId: targetId,
            },
        });

        res.json({ success: true, message: "User blocked" });
    } catch (error) {
        // Unique constraint violation means already blocked
        res.json({ success: true, message: "User blocked" });
    }
});

// Unblock a user
router.post("/unblock", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const schema = z.object({ targetId: z.string() });
        const validation = schema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: "Invalid target ID" });
        }

        const { targetId } = validation.data;

        await prisma.block.deleteMany({
            where: {
                blockerId: userId,
                blockedId: targetId,
            },
        });

        res.json({ success: true, message: "User unblocked" });
    } catch (error) {
        res.status(500).json({ error: "Failed to unblock user" });
    }
});

// Report a user
router.post("/report", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const schema = z.object({
            targetId: z.string(),
            reason: z.string().min(1),
            description: z.string().optional(),
        });

        const validation = schema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }

        const { targetId, reason, description } = validation.data;

        await prisma.report.create({
            data: {
                reporterId: userId,
                reportedId: targetId,
                reason,
                description,
            },
        });

        res.json({ success: true, message: "Report submitted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to report user" });
    }
});

export default router;
