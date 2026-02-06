import { logger } from "../utils/logger";
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

const router = Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "Nightout <noreply@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:8081"; // Deep link prefix or web url
const GENERIC_MESSAGE = "If an account exists with this email, you will receive a reset link.";

// Forgot Password
router.post("/forgot", async (req: Request, res: Response) => {
    try {
        const validation = z.object({ email: z.string().email() }).safeParse(req.body);
        if (!validation.success) {
            return res.json({ message: GENERIC_MESSAGE });
        }

        const { email } = validation.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.json({ message: GENERIC_MESSAGE });
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Clear old tokens
        await prisma.passwordResetToken.deleteMany({ where: { email } });

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expiresAt,
            },
        });

        // Send email
        if (resend) {
            await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: "Reset your password",
                html: `<p>You requested a password reset.</p><p>Click here to reset: <a href="${APP_URL}/reset-password?token=${token}">Reset Password</a></p>`,
            });
        } else {
            console.log(`[DEV] Password reset link for ${email}: ${APP_URL}/reset-password?token=${token}`);
        }

        return res.json({ message: GENERIC_MESSAGE });
    } catch (error) {
        logger.error("Forgot password error:", error);
        return res.json({ message: GENERIC_MESSAGE });
    }
});

// Reset Password
router.post("/reset", async (req: Request, res: Response) => {
    try {
        const schema = z
            .object({
                token: z.string(),
                newPassword: z.string().min(8).optional(),
                password: z.string().min(8).optional(), // legacy
            })
            .refine((data) => data.newPassword || data.password, {
                message: "newPassword is required",
            });

        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const { token } = validation.data;
        const newPassword = validation.data.newPassword || validation.data.password!;

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email: resetToken.email },
            data: { passwordHash },
        });

        // Cleanup used token
        await prisma.passwordResetToken.delete({ where: { token } });

        return res.json({ message: "Password updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Failed to reset password" });
    }
});

export default router;
