import { Router, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../index";
import { generateToken, authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Validation schemas - matches Prisma schema
const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["FREELANCER", "EMPLOYER"]).default("FREELANCER"),
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/register
 * Matches Prisma schema: User { id, email, passwordHash, name, role, createdAt, updatedAt }
 */
router.post("/register", async (req, res: Response) => {
    const startTime = Date.now();
    console.log("[REGISTER] === Request received ===");
    console.log("[REGISTER] Body:", req.body ? { ...req.body, password: "[REDACTED]" } : "EMPTY");

    try {
        // Validate input
        console.log("[REGISTER] Validating input...");
        const data = registerSchema.parse(req.body);

        // Get name from either displayName or name field
        const userName = data.displayName || data.name || null;

        console.log("[REGISTER] Validated:", { email: data.email, role: data.role, name: userName });

        // Check if user exists
        console.log("[REGISTER] Checking for existing user...");
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing) {
            console.log("[REGISTER] Email already exists:", data.email);
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        console.log("[REGISTER] Hashing password...");
        const passwordHash = await bcrypt.hash(data.password, 10);

        // Create user - using correct field names from schema
        console.log("[REGISTER] Creating user...");
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash: passwordHash,  // Schema uses 'passwordHash' not 'password'
                name: userName,
                role: data.role,
            },
        });

        console.log("[REGISTER] User created:", user.id);

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        const totalTime = Date.now() - startTime;
        console.log("[REGISTER] SUCCESS in", totalTime, "ms for:", user.email);

        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
        });
    } catch (error: any) {
        const totalTime = Date.now() - startTime;
        console.error("[REGISTER] ERROR after", totalTime, "ms");

        // Zod validation error
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
            console.error("[REGISTER] Validation errors:", errors);
            return res.status(400).json({
                error: error.errors[0].message,
                details: errors,
            });
        }

        // Prisma error - log full details
        if (error.code) {
            console.error("[REGISTER] Prisma error:", {
                code: error.code,
                meta: error.meta,
                message: error.message,
            });

            // P2002 = Unique constraint violation
            if (error.code === "P2002") {
                return res.status(400).json({
                    error: "Email already registered",
                    code: error.code,
                });
            }

            // P2003 = Foreign key constraint
            if (error.code === "P2003") {
                return res.status(400).json({
                    error: "Invalid reference",
                    code: error.code,
                    details: error.meta?.field_name,
                });
            }

            // Other Prisma errors
            return res.status(500).json({
                error: "Database error",
                code: error.code,
                details: process.env.NODE_ENV !== "production" ? error.message : undefined,
            });
        }

        // Generic error
        console.error("[REGISTER] Unknown error:", error.message, error.stack);
        return res.status(500).json({
            error: "Registration failed",
            details: process.env.NODE_ENV !== "production" ? error.message : undefined,
        });
    }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res: Response) => {
    console.log("[LOGIN] === Request received ===");
    console.log("[LOGIN] Body:", req.body ? { email: req.body.email, password: "[REDACTED]" } : "EMPTY");

    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            console.log("[LOGIN] User not found:", data.email);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password - using passwordHash field
        const valid = await bcrypt.compare(data.password, user.passwordHash);
        if (!valid) {
            console.log("[LOGIN] Invalid password for:", data.email);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        console.log("[LOGIN] SUCCESS for:", user.email);

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
            console.error("[LOGIN] Validation errors:", errors);
            return res.status(400).json({
                error: error.errors[0].message,
                details: errors,
            });
        }
        console.error("[LOGIN] Error:", error.message);
        return res.status(500).json({ error: "Login failed" });
    }
});

/**
 * GET /api/auth/me
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
            name: user.name,
        });
    } catch (error: any) {
        console.error("[ME] Error:", error.message);
        return res.status(500).json({ error: "Failed to get user" });
    }
});

export default router;
