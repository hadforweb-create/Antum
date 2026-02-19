import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { PrismaClient } from "@prisma/client";
import { logger } from "./utils/logger";

// Import routes
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import reelsRoutes from "./routes/reels";
import uploadsRoutes from "./routes/uploads";
import skillsRoutes from "./routes/skills";
import conversationsRoutes from "./routes/conversations";
import servicesRoutes from "./routes/services";
import shortlistRoutes from "./routes/shortlist";
import storageRoutes from "./routes/storage";
import securityRoutes from "./routes/security";
import passwordRoutes from "./routes/password";
import ordersRoutes from "./routes/orders";
import reviewsRoutes from "./routes/reviews";
import walletRoutes from "./routes/wallet";
import orderNotifRoutes from "./routes/notifications-order";

// Initialize Sentry
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring - 10% in prod, 100% in dev
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
}

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Initialize Prisma with logging
export const prisma = new PrismaClient({
    log: ["error", "warn"],
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Sentry Request Handler must be the first middleware on the app
// In Sentry Node SDK v8+, request/tracing handlers are deprecated/removed in favor of automatic instrumentation
// but we keep init.

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? process.env.CORS_ORIGIN?.split(",") || false
        : "*",
}));
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Health endpoints
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health/live", (_req, res) => {
    res.json({ status: "live" });
});

app.get("/health/ready", async (_req, res) => {
    // Check required env vars
    const requiredEnvVars = [
        "DATABASE_URL",
        "JWT_SECRET",
    ];
    const optionalButRecommended = [
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_BUCKET_NAME",
    ];
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    const missingOptional = optionalButRecommended.filter(v => !process.env[v]);

    if (missing.length > 0) {
        return res.status(503).json({
            status: "not ready",
            missing: missing,
        });
    }

    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: "ready",
            database: "connected",
            env: "ok",
            warnings: missingOptional.length > 0 ? `Missing optional: ${missingOptional.join(", ")}` : undefined,
        });
    } catch (error) {
        res.status(503).json({ status: "not ready", database: "disconnected" });
    }
});

// API Routes - with rate limiting
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/security", authLimiter, securityRoutes);
app.use("/api/password", authLimiter, passwordRoutes);

app.use("/api", apiLimiter);

app.use("/api/storage", storageRoutes); // Uses its own auth/validation
app.use("/api/users", usersRoutes);
app.use("/api/reels", reelsRoutes);
app.use("/api/uploads", uploadsRoutes); // Legacy local upload, kept for compat or fallback
app.use("/api/skills", skillsRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/shortlist", shortlistRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/notifications", orderNotifRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Sentry Error Handler
if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}

// Central error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("Error:", err.message);
    res.status(500).json({
        error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message
    });
});

// Graceful shutdown
async function shutdown() {
    logger.log("\nShutting down...");
    await prisma.$disconnect();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server with explicit prisma connection
async function main() {
    try {
        logger.log("[STARTUP] Connecting to database...");
        await prisma.$connect();
        logger.log("[STARTUP] Database connected successfully");

        // Verify connection works
        await prisma.$queryRaw`SELECT 1`;
        logger.log("[STARTUP] Database query test passed");

        app.listen(PORT, () => {
            logger.log(`
  🚀 ANTUM Backend running!
  
  Local:   http://localhost:${PORT}
  Health:  http://localhost:${PORT}/health
  
  API:     http://localhost:${PORT}/api
  Database: Connected
  `);
        });
    } catch (error) {
        logger.critical("[STARTUP] Failed to connect to database:", error);
        process.exit(1);
    }
}


main();
