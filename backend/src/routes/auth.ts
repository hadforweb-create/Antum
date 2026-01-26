import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../index";
import { generateToken, authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["FREELANCER", "EMPLOYER"]),
    displayName: z.string().min(1).optional(),
    companyName: z.string().min(1).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user with profile
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role: data.role,
                ...(data.role === "FREELANCER" && {
                    freelancerProfile: {
                        create: {
                            displayName: data.displayName || data.email.split("@")[0],
                        },
                    },
                }),
                ...(data.role === "EMPLOYER" && {
                    employerProfile: {
                        create: {
                            companyName: data.companyName || "My Company",
                        },
                    },
                }),
            },
            include: {
                freelancerProfile: true,
                employerProfile: true,
            },
        });

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.freelancerProfile || user.employerProfile,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("Register error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: {
                freelancerProfile: true,
                employerProfile: true,
            },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password
        const valid = await bcrypt.compare(data.password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.freelancerProfile || user.employerProfile,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

/**
 * GET /api/auth/me
 */
router.get("/me", authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: {
                freelancerProfile: true,
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
        console.error("Me error:", error);
        res.status(500).json({ error: "Failed to get user" });
    }
});

export default router;
