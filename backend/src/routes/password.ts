import { logger } from "../utils/logger";
import { Router, Request, Response } from "express";

const router = Router();

/**
 * Password reset is now handled by Supabase Auth.
 * These routes are kept as stubs to avoid 404s from old clients.
 */

// Forgot Password - delegate to Supabase
router.post("/forgot", async (_req: Request, res: Response) => {
    // Supabase handles password reset emails via supabase.auth.resetPasswordForEmail()
    logger.log("[PASSWORD] /forgot called - use Supabase Auth for password resets");
    return res.json({
        message: "If an account exists with this email, you will receive a reset link.",
    });
});

// Reset Password - delegate to Supabase
router.post("/reset", async (_req: Request, res: Response) => {
    // Supabase handles password updates via supabase.auth.updateUser({ password })
    logger.log("[PASSWORD] /reset called - use Supabase Auth for password resets");
    return res.json({
        message: "Password resets are handled by the Supabase Auth system.",
    });
});

export default router;
