import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

const FROM_EMAIL = process.env.FROM_EMAIL || "Nightout <noreply@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:8081"; // Deep link prefix or web url?

// Forgot Password
router.post("/forgot", async (req: Request, res: Response) => {
    try {
        const validation = z.object({ email: z.string().email() }).safeParse(req.body);

        if (!validation.success) {
            // Return 200 even on invalid email to prevent timing attacks? 
            // Better to validate format at least.
            return res.status(400).json({ error: "Invalid email format" });
        }

        const { email } = validation.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Fake success to prevent enumeration
            return res.json({ message: "If an account exists with this email, you will receive a reset link." });
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
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: "Reset your password",
                html: `<p>You requested a password reset.</p><p>Click here to reset: <a href="${APP_URL}/reset-password?token=${token}">Reset Password</a></p>`,
            });
        } else {
            console.log(`[DEV] Password reset link for ${email}: ${APP_URL}/reset-password?token=${token}`);
        }

        res.json({ message: "If an account exists with this email, you will receive a reset link." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Failed to process request" });
    }
});

// Reset Password
router.post("/reset", async (req: Request, res: Response) => {
    try {
        const schema = z.object({
            token: z.string(),
            password: z.string().min(8),
        });

        const validation = schema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const { token, password } = validation.data;

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email: resetToken.email },
            data: { passwordHash },
        });

        // Cleanup used token
        await prisma.passwordResetToken.delete({ where: { token } });

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to reset password" });
    }
});

export default router;
