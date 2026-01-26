import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";

// Import routes
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import reelsRoutes from "./routes/reels";
import uploadsRoutes from "./routes/uploads";
import skillsRoutes from "./routes/skills";

// Initialize Prisma
export const prisma = new PrismaClient();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reels", reelsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/skills", skillsRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});

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

// Start server
app.listen(PORT, () => {
    console.log(`
  🚀 ANTUM Backend running!
  
  Local:   http://localhost:${PORT}
  Health:  http://localhost:${PORT}/health
  
  API:     http://localhost:${PORT}/api
  `);
});
