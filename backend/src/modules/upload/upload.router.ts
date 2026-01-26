// Upload Router - POST /api/uploads
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { handleUpload } from "./upload.controller.js";

const router = Router();

// Configure multer for memory storage (we'll stream to S3)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
});

// POST /api/uploads - Upload a file
router.post("/", requireAuth, upload.single("file"), handleUpload);

export default router;
