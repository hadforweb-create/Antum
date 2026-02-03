import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { PrismaClient } from "@prisma/client";

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

// Initialize Sentry
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
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
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ready", database: "connected" });
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
    console.error("Error:", err.message);
    res.status(500).json({
        error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message
    });
});

// Graceful shutdown
async function shutdown() {
    console.log("\nShutting down...");
    await prisma.$disconnect();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start server with explicit prisma connection
async function main() {
    try {
        console.log("[STARTUP] Connecting to database...");
        await prisma.$connect();
        console.log("[STARTUP] Database connected successfully");

        // Verify connection works
        await prisma.$queryRaw`SELECT 1`;
        console.log("[STARTUP] Database query test passed");

        app.listen(PORT, () => {
            console.log(`
  🚀 ANTUM Backend running!
  
  Local:   http://localhost:${PORT}
  Health:  http://localhost:${PORT}/health
  
  API:     http://localhost:${PORT}/api
  Database: Connected
  `);
        });
    } catch (error) {
        console.error("[STARTUP] Failed to connect to database:", error);
        process.exit(1);
    }
}

main();
