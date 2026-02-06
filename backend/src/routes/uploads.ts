import { logger } from "../utils/logger";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/quicktime",
            "video/webm",
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"));
        }
    },
});

/**
 * POST /api/uploads
 * Upload a file (image or video)
 */
router.post(
    "/",
    authenticate,
    upload.single("file"),
    async (req: AuthRequest, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file provided" });
            }

            const baseUrl = process.env.S3_PUBLIC_URL ||
                `${req.protocol}://${req.get("host")}`;

            const mediaType = req.file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE";
            const url = `${baseUrl}/uploads/${req.file.filename}`;

            res.json({
                url,
                mediaType,
                filename: req.file.filename,
                size: req.file.size,
                mimeType: req.file.mimetype,
            });
        } catch (error) {
            logger.error("Upload error:", error);
            res.status(500).json({ error: "Upload failed" });
        }
    }
);

// Error handling for multer
router.use((err: Error, _req: any, res: any, _next: any) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too large (max 100MB)" });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "Invalid file type") {
        return res.status(400).json({ error: "Invalid file type" });
    }
    throw err;
});

export default router;
