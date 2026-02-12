import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();

/**
 * POST /api/auth/register
 * Called AFTER Supabase signUp — syncs user to Prisma.
 * Expects Authorization: Bearer <supabase_access_token>
 * Body (optional overrides): { role, username, displayName }
 */
router.post("/register", authenticate, async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    logger.log("[REGISTER] === Request received ===");

    try {
        const { userId, email } = req.user!;
        const body = req.body || {};

        const role = body.role || req.user!.role || "FREELANCER";
        const displayName = body.displayName || req.user!.displayName || null;
        const username = body.username || req.user!.username || null;

        logger.log("[REGISTER] Upserting user:", { userId, email, role, displayName, username });

        const user = await prisma.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                email,
                displayName,
                username,
                role,
            },
            update: {
                email,
                displayName: displayName || undefined,
                username: username || undefined,
                role,
            },
        });

        const totalTime = Date.now() - startTime;
        logger.log("[REGISTER] SUCCESS in", totalTime, "ms for:", user.email);

        return res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                displayName: user.displayName,
                username: user.username,
            },
        });
    } catch (error: any) {
        const totalTime = Date.now() - startTime;
        logger.error("[REGISTER] ERROR after", totalTime, "ms");

        // Prisma unique constraint
        if (error.code === "P2002") {
            return res.status(400).json({
                error: "Username or email already taken",
                code: error.code,
            });
        }

        logger.error("[REGISTER] Error:", error.message, error.stack);
        return res.status(500).json({
            error: "Registration failed",
            details: process.env.NODE_ENV !== "production" ? error.message : undefined,
        });
    }
});

/**
 * POST /api/auth/login
 * Called AFTER Supabase signIn — syncs/retrieves user from Prisma.
 * Expects Authorization: Bearer <supabase_access_token>
 */
router.post("/login", authenticate, async (req: AuthRequest, res: Response) => {
    logger.log("[LOGIN] === Request received ===");

    try {
        const { userId, email } = req.user!;

        // Upsert: create if first login, update email if changed
        const user = await prisma.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                email,
                role: req.user!.role || "FREELANCER",
                displayName: req.user!.displayName || null,
                username: req.user!.username || null,
            },
            update: {
                email,
            },
        });

        logger.log("[LOGIN] SUCCESS for:", user.email);

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                displayName: user.displayName,
                username: user.username,
            },
        });
    } catch (error: any) {
        logger.error("[LOGIN] Error:", error.message);
        return res.status(500).json({ error: "Login failed" });
    }
});

/**
 * GET /api/auth/me
 * Returns the current user from Prisma.
 * Expects Authorization: Bearer <supabase_access_token>
 */
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
            username: user.username,
        });
    } catch (error: any) {
        logger.error("[ME] Error:", error.message);
        return res.status(500).json({ error: "Failed to get user" });
    }
});

export default router;
